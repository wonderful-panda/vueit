import "reflect-metadata";
import * as Vue from "vue";
import * as types from "../types";

class AnnotatedOptions {
    props: { [key: string]: Vue.PropOptions } = {};
    watch: { [key: string]: Vue.WatchOptions & { handler: Vue.WatchHandler<Vue> } } = {};
    events: { [key: string]: (...args: any[]) => boolean | void } = {};
}

const AnnotatedOptionsKey = "vueit:component-options";
const DesignTypeKey = "design:type";

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

function defineProp(target: Object, propertyKey: string, options: Vue.PropOptions) {
    options = Object.assign({}, options);
    // detect design type and set prop validation
    const type = Reflect.getOwnMetadata(DesignTypeKey, target, propertyKey);
    trySetPropTypeValidation(target, propertyKey, options, type);
    getAnnotatedOptions(target).props[propertyKey] = options;
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

const prop = <types.PropType>function (...args): PropertyDecorator {
    if (args.length <= 1) {
        // Used with argument list. Like `@prop()` or `@prop({ ... })`
        const options = <Vue.PropOptions>(args[0] || {});
        return (target, propertyKey) => defineProp(target, propertyKey.toString(), options);
    }
    else {
        // Used without argument list. Like `@prop`
        const target = args[0];
        const propertyKey = args[1].toString();
        defineProp(target, propertyKey, {});
    }
};
prop.required = function (...args): PropertyDecorator {
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
    prop: prop,
    watch: function (option: string | types.WatchOptions): PropertyDecorator {
        return (target, propertyKey) => defineWatch(target, propertyKey.toString(),
            typeof option === "string" ? { name: option } : option);
    }
}

export = vueit;
