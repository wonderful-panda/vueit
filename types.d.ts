import * as Vue from "vue";

export interface WatchOptions {
    name: string;
    deep?: boolean;
    immediate?: boolean;
}

export interface CompiledTemplate {
    render: (createElement: typeof Vue.prototype.$createElement) => Vue.VNode;
    staticRenderFns: ((createElement: typeof Vue.prototype.$createElement) => Vue.VNode)[];
}

export type ComponentOptions = Vue.ComponentOptions<Vue> & { template?: string|CompiledTemplate };

