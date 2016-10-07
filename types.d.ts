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

export interface ComponentOptions {
    el?: Element | String;
    template?: string | CompiledTemplate;

    directives?: { [key: string]: Vue.DirectiveOptions | Vue.DirectiveFunction };
    components?: { [key: string]: Vue.Component | Vue.AsyncComponent };
    transitions?: { [key: string]: Object };
    filters?: { [key: string]: Function };

    mixins?: (Vue.ComponentOptions<Vue> | typeof Vue)[];
    name?: string;
    extends?: Vue.ComponentOptions<Vue> | typeof Vue;
    delimiters?: [string, string];
}

