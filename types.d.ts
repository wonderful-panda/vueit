import * as Vue from "vue";

export interface WatchOptions {
    name: string;
    deep?: boolean;
    immediate?: boolean;
}

type $createElement = typeof Vue.prototype.$createElement;

export interface CompiledTemplate {
    render: (createElement: $createElement) => Vue.VNode;
    staticRenderFns: ((createElement: $createElement) => Vue.VNode)[];
}

export type ComponentOptions<V extends Vue> = Vue.ComponentOptions<V> & { compiledTemplate?: CompiledTemplate };

