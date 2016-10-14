import "reflect-metadata";
import * as Vue from "vue";
import * as types from "../types";

class AnnotatedOptions {
    props: { [key: string]: Vue.PropOptions } = {};
    paramTypes: any[] = undefined;
    paramProps: Vue.PropOptions[] = [];
    watch: { [key: string]: Vue.WatchOptions & { handler: Vue.WatchHandler<Vue> } } = {};
    events: { [key: string]: (...args: any[]) => boolean | void } = {};
}

const AnnotatedOptionsKey = "vueit:component-options";
const DesignTypeKey = "design:type";
const DesignParamTypesKey = "design:paramtypes";

const internalHooks = [
    "data",
    "render",
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeUpdate",
    "updated",
    "activated",
    "deactivated",
    "beforeDestroy",
    "destroyed"
];

function warn(msg: string) {
    console.warn("[vueit warn]: " + msg);
}

function error(msg: string) {
    console.error("[vueit error]: " + msg);
}

function makeComponent<V extends Vue>(target: Function, option: types.ComponentOptions<V>): Function | void {
    option = Object.assign({}, option);
    option.name = option.name || target["name"];
    if (option.compiledTemplate) {
        option.render = option.compiledTemplate.render;
        option.staticRenderFns = option.compiledTemplate.staticRenderFns;
        if (option.template) {
            warn(`"compiledtemplate" and "template" are exclusive. "template" is ignored: ${ target.name }`)
            delete option.template;
        }
    };
    const proto = target.prototype;
    Object.getOwnPropertyNames(proto).filter(name => name !== "constructor").forEach(name => {
        // hooks
        if (internalHooks.indexOf(name) > -1) {
            option[name] = proto[name];
        }
        const descriptor = Object.getOwnPropertyDescriptor(proto, name);
        if (typeof descriptor.value === "function") {
            // methods
            (option.methods || (option.methods = {}))[name] = descriptor.value;
        }
        else if (descriptor.get || descriptor.set) {
            // computed
            (option.computed || (option.computed = {}))[name] = {
                get: descriptor.get,
                set: descriptor.set
            };
        }
    });
    const ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, proto) as AnnotatedOptions;
    if (ann != null) {
        // props
        option.props = option.props || ann.props;
        // watch
        option.watch = option.watch || ann.watch;
    }
    // find super
    const superProto = Object.getPrototypeOf(proto);
    const Super = (superProto instanceof Vue
        ? superProto.constructor as (typeof Vue)
        : Vue
    );
    return Super.extend(option);
}

function makefunctionalComponent(target: Function): Function | void {
    const obj: any = ("render" in target ? target : target.prototype);
    const render = <(h: types.$createElement, context: Vue.VNodeData, ...props) => Vue.VNode>obj.render;
    if (render.length < 2) {
        error(`"render" function must have at least 2 parameters: ${ target.name }`);
        return;
    }
    const paramNames = getParamNames(render.toString());
    if (render.length !== paramNames.length) {
        error(`failed to parse parameter list: ${ target.name }`);
        return;
    }
    paramNames.splice(0, 2); // first 2 params are createElement and context.
    const ao = Reflect.getOwnMetadata(AnnotatedOptionsKey, obj) as AnnotatedOptions;
    const paramProps = ao ? ao.paramProps : [];
    const props: { [name: string]: Vue.PropOptions } = {}
    paramNames.forEach((name, i) => {
        props[name] = paramProps[i + 2];
    });
    const options: Vue.FunctionalComponentOptions = {
        name: target.name,
        functional: true,
        props,
        render: (
            paramNames.length === 0
            ? render
            : function(h, context) {
                const args = paramNames.map(name => context.props[name]);
                return render(h, context, ...args);
            }
        )
    };
    return Vue.extend(options);
}

function getParamNames(source: string): string[] {
    const withoutComment = source.replace(/(\/\*.*?\*\/)|(\/\/.*$)/mg, "");
    const matched = /\(\s*(.*?)\s*\)/.exec(withoutComment);
    if (!matched) {
        return [];
    }
    return matched[1].split(/\s*,\s*/g);
}

function getAnnotatedOptions(target: Object): AnnotatedOptions {
    let ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, target) as AnnotatedOptions;
    if (ann == null) {
        ann = new AnnotatedOptions();
        Reflect.defineMetadata(AnnotatedOptionsKey, ann, target);
    }
    return ann;
}

function trySetPropTypeValidation(target: Object, propertyKey: string, opts: Vue.PropOptions, type): void {
    if ([String, Number, Boolean, Function, Array].indexOf(type) <= -1) {
        return;
    }
    if (typeof opts.type !== "undefined") {
        if ([String, Number, Boolean, Function, Array].indexOf(<any>opts.type) >= 0 && opts.type !== type) {
            warn(`specified type validation does not match design type: ${ target.constructor.name }.${ propertyKey }`)
        }
        return;
    }
    opts.type = type;
}

function defineProp(target: Object, propertyKey: string, paramIndex: number, options: Vue.PropOptions) {
    options = Object.assign({}, options);
    if (typeof paramIndex === "undefined") {
        definePropForField(target, propertyKey, options);
    }
    else {
        definePropForParameter(target, propertyKey, paramIndex, options);
    }
}

function definePropForField(target: Object, propertyKey: string, options: Vue.PropOptions) {
    // detect design type and set prop validation
    const type = Reflect.getOwnMetadata(DesignTypeKey, target, propertyKey);
    trySetPropTypeValidation(target, propertyKey, options, type);
    getAnnotatedOptions(target).props[propertyKey] = options;
}

function definePropForParameter(target: Object, propertyKey: string, paramIndex: number, options: Vue.PropOptions) {
    if (propertyKey !== "render") {
        warn(`when @prop is used as parameter decorator, it can be used in "render" method: ${ target.constructor.name }.${ propertyKey }`);
        return;
    }
    const ao = getAnnotatedOptions(target);
    if (!ao.paramTypes) {
        ao.paramTypes = Reflect.getOwnMetadata(DesignParamTypesKey, target, propertyKey);
    };
    trySetPropTypeValidation(target, propertyKey, options, ao.paramTypes[paramIndex]);
    ao.paramProps[paramIndex] = options;
}

function defineWatch(target: Object, propertyKey: string, option: types.WatchOptions) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (typeof descriptor.value !== "function") {
        warn(`@watch() can decorate only function: ${ target.constructor.name }.${ propertyKey }`)
        return;
    }
    getAnnotatedOptions(target).watch[option.name] = {
        handler: descriptor.value,
        deep: option.deep,
        immediate: option.immediate
    };
}

const prop = <types.PropType>function (...args): PropertyDecorator & ParameterDecorator {
    if (args.length <= 1) {
        // Used with argument list. Like `@prop()` or `@prop({ ... })`
        const options = <Vue.PropOptions>(args[0] || {});
        return (target, propertyKey, paramIndex?) => defineProp(target, propertyKey.toString(), paramIndex, options);
    }
    else {
        // Used without argument list. Like `@prop`
        const target = args[0];
        const propertyKey = args[1].toString();
        const paramIndex = <number>args[2];
        defineProp(target, propertyKey, paramIndex, {});
    }
};
prop.required = function (...args): PropertyDecorator & ParameterDecorator {
    if (args.length <= 1) {
        // Used with argument list. Like `@prop.required()` or `@prop.required({ ... })`
        return prop(Object.assign({ required: true }, args[0]));
    }
    else {
        // Used without argument list. Like `@prop.required`
        return prop({ required: true }).apply(null, args);
    }
}
prop.default = function (defaultValue: any, options?: Vue.PropOptions): PropertyDecorator {
    return prop(Object.assign({ default: defaultValue }, options));
}

const vueit = {
    component<V extends Vue>(option?: types.ComponentOptions<V>): ClassDecorator {
        return target => makeComponent(target, option || {});
    },
    functionalComponent: makefunctionalComponent as ClassDecorator,
    prop: prop,
    watch: function (option: string | types.WatchOptions): PropertyDecorator {
        return (target, propertyKey) => defineWatch(target, propertyKey.toString(),
            typeof option === "string" ? { name: option } : option);
    }
}

export = vueit;
