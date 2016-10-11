import * as Vue from "vue";

export interface WatchOptions {
    name: string;
    deep?: boolean;
    immediate?: boolean;
}

export interface PropDecoratorType {
    (options?: Vue.PropOptions): PropertyDecorator;
    (target: any, propertyKey: string | Symbol): void;
}

export interface PropType extends PropDecoratorType {
    required: PropDecoratorType;
    default: (defaultValue: any, options?: Vue.PropOptions) => PropertyDecorator;
}

type $createElement = typeof Vue.prototype.$createElement;

export interface CompiledTemplate {
    render: (createElement: $createElement) => Vue.VNode;
    staticRenderFns: ((createElement: $createElement) => Vue.VNode)[];
}

export type ComponentOptions<V extends Vue> = Vue.ComponentOptions<V> & { compiledTemplate?: CompiledTemplate };

