import "reflect-metadata";
import * as Vue from "vue";

interface WatchOption {
    name: string;
    deep?: boolean;
    immediate?: boolean;
}

class AnnotatedOptions {
    props: { [key: string]: vuejs.PropOption } = {};
    watch: { [key: string]: vuejs.WatchOption } = {};
    events: { [key: string]: (...args: any[]) => boolean | void } = {};
}

const AnnotatedOptionsKey = "vue-component-decorator:options";
const DesignTypeKey = "design:type";

const internalHooks = [
    "data",
    "el",
    "init",
    "created",
    "ready",
    "beforeCompile",
    "compiled",
    "beforeDestroy",
    "destroyed",
    "attached",
    "detached",
    "activate"
];

function assign(target: {}, other: {}) {
    Object.keys(other).forEach(k => {
        target[k] = other[k];
    })
    return target;
}

function makeComponent(target: Function, option: vuejs.ComponentOption): Function | void {
    option = assign({}, option);
    option.name = option.name || target["name"];
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
        // events
        option.events = option.events || ann.events;
    }
    // find super
    const superProto = Object.getPrototypeOf(proto);
    const Super = (superProto instanceof Vue
        ? (superProto.constructor as vuejs.VueStatic)
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

function defineProp(target: Object, propertyKey: string, option: vuejs.PropOption) {
    // detect design type and set prop validation
    if ("type" in option) {
        // type specified explicitly, nothing to do
    }
    else {
        const type = Reflect.getOwnMetadata(DesignTypeKey, target, propertyKey);
        if ([String, Number, Boolean, Function, Array].indexOf(type) > -1) {
            option = assign({ type }, option);
        }
    }
    getAnnotatedOptions(target).props[propertyKey] = option;
}

function defineWatch(target: Object, propertyKey: string, option: WatchOption) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (typeof descriptor.value !== "function") {
        // TODO: show warning
        return;
    }
    getAnnotatedOptions(target).watch[option.name] = {
        handler: descriptor.value,
        deep: option.deep,
        immidiate: option.immediate
    };
}

function defineEvent(target: Object, propertyKey: string, name: string) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (typeof descriptor.value !== "function") {
        // TODO: show warning
        return;
    }
    getAnnotatedOptions(target).events[name] = descriptor.value;
}

const prop = function (option?: vuejs.PropOption): PropertyDecorator {
    return (target, propertyKey) => defineProp(target, propertyKey.toString(), option || {});
};

const vueit = {
    component: function (option?: vuejs.ComponentOption): ClassDecorator {
        return target => makeComponent(target, option || {});
    },
    prop: prop,
    p: prop(),
    pr: prop({ required: true }),
    pd: defaultValue => prop({ default: defaultValue }),
    watch: function (option: string | WatchOption): PropertyDecorator {
        return (target, propertyKey) => defineWatch(target, propertyKey.toString(),
            typeof option === "string" ? { name: option } : option);
    },
    on: function (name: string): PropertyDecorator {
        return (target, propertyKey) => defineEvent(target, propertyKey.toString(), name);
    }
}

export = vueit;
