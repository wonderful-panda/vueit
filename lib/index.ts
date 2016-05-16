import "reflect-metadata";
import * as Vue from "vue";

declare type PropOption = vuejs.PropOption | (new (...args: any[]) => any) | (new (...args: any[]) => any)[];

interface AnnotatedOptions {
    props: { [key: string]: vuejs.PropOption };
}

interface VueComponent {
    (option?: vuejs.ComponentOption): ClassDecorator;
    prop: (option?: vuejs.PropOption) => PropertyDecorator;
}

const AnnotatedOptionsKey = Symbol("vue-component-decorator:options");
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

function makeComponent(target: Function, option: vuejs.ComponentOption): Function | void {
    option.name = option.name || target.name;
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
    }
    // find super
    const superProto = Object.getPrototypeOf(proto);
    const Super = (superProto instanceof Vue
        ? (superProto.constructor as vuejs.VueStatic)
        : Vue
    );
    return Super.extend(option);
}

function defineProp(target: Object, propertyKey: string, option: PropOption) {
    let ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, target) as AnnotatedOptions;
    if (ann == null) {
        ann = { props: {} };
        Reflect.defineMetadata(AnnotatedOptionsKey, ann, target);
    }
    // detect design type and set prop validation
    if (option instanceof Function || option instanceof Array || "type" in option) {
        // type specified explicitly, nothing to do
    }
    else {
        const type = Reflect.getOwnMetadata(DesignTypeKey, target, propertyKey);
        if ([String, Number, Function, Array].indexOf(type) > -1) {
            option.type = type;
        }
    }
    ann.props[propertyKey] = option;
}

const vueComponent: any = (option?: vuejs.ComponentOption): ClassDecorator => {
    return target => makeComponent(target, option || {});
};

vueComponent.prop = function (option?: PropOption): PropertyDecorator {
    return (target, propertyKey) => defineProp(target, propertyKey.toString(), option || {});
};

export default vueComponent as VueComponent;
