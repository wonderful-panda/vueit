import "reflect-metadata";
import * as Vue from "vue";
import * as types from "../types";

class AnnotatedOptions {
    props: { [key: string]: Vue.PropOptions } = {};
    watch: { [key: string]: Vue.WatchOptions & { handler: Vue.WatchHandler<Vue> } } = {};
    events: { [key: string]: (...args: any[]) => boolean | void } = {};
}

const AnnotatedOptionsKey = "vue-component-decorator:options";
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

function makeComponent(target: Function, orgOption: types.ComponentOptions): Function | void {
    const option: Vue.ComponentOptions<Vue> = {};
    const o = Object.assign({}, orgOption);
    option.name = o.name || target["name"];
    // if o.template is precompiled template,
    // set `render` and `staticRenderFns` instead of `template`
    if (o.template && typeof o.template["render"] !== "undefined") {
        const ct = o.template as types.CompiledTemplate;
        option.render = ct.render;
        option.staticRenderFns = ct.staticRenderFns;
        delete o.template;
    };
    Object.assign(option, o);
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

function defineProp(target: Object, propertyKey: string, option: Vue.PropOptions) {
    // detect design type and set prop validation
    if ("type" in option) {
        // type specified explicitly, nothing to do
    }
    else {
        const type = Reflect.getOwnMetadata(DesignTypeKey, target, propertyKey);
        if ([String, Number, Boolean, Function, Array].indexOf(type) > -1) {
            option = Object.assign({ type }, option);
        }
    }
    getAnnotatedOptions(target).props[propertyKey] = option;
}

function defineWatch(target: Object, propertyKey: string, option: types.WatchOptions) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (typeof descriptor.value !== "function") {
        // TODO: show warning
        return;
    }
    getAnnotatedOptions(target).watch[option.name] = {
        handler: descriptor.value,
        deep: option.deep,
        immediate: option.immediate
    };
}

const prop = function (option?: Vue.PropOptions): PropertyDecorator {
    return (target, propertyKey) => defineProp(target, propertyKey.toString(), option || {});
};

const vueit = {
    component: function (option?: types.ComponentOptions): ClassDecorator {
        return target => makeComponent(target, option || {});
    },
    prop: prop,
    p: prop(),
    pr: prop({ required: true }),
    pd: defaultValue => prop({ default: defaultValue }),
    watch: function (option: string | types.WatchOptions): PropertyDecorator {
        return (target, propertyKey) => defineWatch(target, propertyKey.toString(),
            typeof option === "string" ? { name: option } : option);
    }
}

export = vueit;
