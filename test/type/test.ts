import * as Vue from "vue";
import { component, prop, watch, functionalComponent } from "../..";

const po = {
    validator: (v: number) => v >= 0
};

@component({
    template: "<div></div>"
})
class MyComponent extends Vue {
    @prop p1: number;
    @prop(po) p2: number;
    @prop.required p3: number;
    @prop.required(po) p4: number;
    @prop.default(0) p5: number;
    @prop.default(0, po) p6: number;
    @watch("p1")
    onP1Change(v: number, old: number) {
    }
}

@functionalComponent
class MyFuncComponent extends Vue {
    @prop p1: number;
    @prop(po) p2: number;
    @prop.required p3: number;
    @prop.required(po) p4: number;
    @prop.default(0) p5: number;
    @prop.default(0, po) p6: number;
    render(h: typeof Vue.prototype.$createElement, context: Vue.RenderContext) {
        return h("div");
    }
}
