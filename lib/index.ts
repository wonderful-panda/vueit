import "reflect-metadata";
import * as Vue from "vue";

interface AnnotatedOptions {
    props: { [key: string]: vuejs.PropOption };
}

interface VueComponent {
    (option?: vuejs.ComponentOption): ClassDecorator;
    prop: (option?: vuejs.PropOption) => PropertyDecorator;
}
const AnnotatedOptionsKey = Symbol("vue-component-decorator:options");

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
        // define hooks
        if (internalHooks.indexOf(name) > -1) {
            option[name] = proto[name];
        }
    });
    const ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, proto) as AnnotatedOptions;
    if (ann != null) {
        // define props
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

function defineProp(target: Object, propertyKey: string, option: vuejs.PropOption) {
    let ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, target) as AnnotatedOptions;
    if (ann == null) {
        ann = { props: {} };
        Reflect.defineMetadata(AnnotatedOptionsKey, ann, target);
    }
    ann.props[propertyKey] = option;
}

const vueComponent: any = (option?: vuejs.ComponentOption): ClassDecorator => {
    return target => makeComponent(target, option || {});
};

vueComponent.prop = function (option?: vuejs.PropOption): PropertyDecorator {
    return (target, propertyKey) => defineProp(target, propertyKey.toString(), option || {});
};

export default vueComponent as VueComponent;
