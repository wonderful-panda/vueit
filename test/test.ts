///<reference types="mocha" />
"use strict";
import * as assert from "power-assert";
import * as Vue from "vue";
import { component, prop, watch, functionalComponent } from "../lib/index";
import * as compiler from "vue-template-compiler";
import * as types from "../types";

function compileTemplate(source: string) {
    const { render, staticRenderFns, errors } = compiler.compile(source);
    if (errors.length > 0) {
        throw errors;
    }
    const toFunction = (body: string) => {
        return Function(body) as (h: typeof Vue.prototype.$createElement) => Vue.VNode;
    }
    return {
        render: toFunction(render),
        staticRenderFns: staticRenderFns.map(toFunction)
    } as types.CompiledTemplate;
}

function querySelectorOf(el: Element) {
    return el.querySelector.bind(el);
}
function querySelectorAllOf(el: Element) {
    return el.querySelectorAll.bind(el);
}

const orgConsoleError = console.error;
describe("vueit", function () {

    let components: any[];
    let warns: string[];
    beforeEach(function () {
        components = [];
        warns = [];
        const head = "[Vue warn]: ";
        console.error = function(msg: string) {
            if (msg.startsWith(head)) {
                warns.push(msg.substr(head.length));
            }
            else {
                orgConsoleError(msg);
            }
        }
    });
    afterEach(function () {
        console.error = orgConsoleError;
        components.forEach(c => { c.$destroy(); });
        assert(components.length === 0);
    });
    function createComponent<T>(C: new (o: Vue.ComponentOptions<Vue>) => T, propsData?: Object, data?: Object): T {
        const c = new C({
            el: document.createElement("div"),
            beforeDestroy: function () {
                components.splice(components.indexOf(this), 1);
            },
            data: data,
            propsData: propsData
        });
        components.push(c);
        return c;
    }

    describe("hooks", function () {
        @component({ template: `<div>test</div>` })
        class Base extends Vue {
            created_: boolean;
            destroyed_: boolean;
            data(): any { return { created_: false, destroyed_: false }; }
            created() { this.created_ = true; }
            destroyed() { this.destroyed_ = true; }
        };
        it("basic", function () {
            const c = createComponent(Base);
            assert(c.created_ === true);
            assert(c.destroyed_ === false);
            c.$destroy();
            assert(c.destroyed_ === true);
        });

        @component()
        class Extended extends Base {
            created_ex: boolean;
            destroyed_ex: boolean;
            data() { return { created_ex: false, destroyed_ex: false }; }
            created() { this.created_ex = true; }
            destroyed() { this.destroyed_ex = true; }
        }
        it("extended - hooks of both Base and Extended are called", function () {
            const c = createComponent(Extended);
            assert(c.created_ === true && c.destroyed_ === false);
            assert(c.created_ex === true && c.destroyed_ex === false);
            c.$destroy();
            assert(c.destroyed_ === true);
            assert(c.destroyed_ex === true);
        });
    });

    describe("props", function () {
        @component({ template: `<div>test</div>` })
        class Basic extends Vue {
            @prop msg1: string;
            @prop.default("value2default") msg2: string;
        }
        it("basic", function () {
            const c = createComponent(Basic, { msg1: "value1" });
            assert(c.msg1 === "value1");
            assert(c.msg2 === "value2default");
        });

        it("basic - override default value", function () {
            const c = createComponent(Basic, { msg2: "value2" });
            assert(typeof c.msg1 === "undefined");
            assert(c.msg2 === "value2");
        });

        @component()
        class Extended extends Basic {
            @prop.default("value2extended") msg2: string;
            @prop msg3: string;
        }
        it("extended - props from both Basic and Extended are enabled", function () {
            const c = createComponent(Extended, { msg1: "value1", msg3: "value3" });
            assert(c.msg1 === "value1");
            assert(c.msg2 === "value2extended");
            assert(c.msg3 === "value3");
        });
        describe("validation - required", function () {
            @component({ template: `<div>test</div>` })
            class Validation extends Vue {
                @prop.required prop1: string;
                @prop.required() prop2: string;
                @prop.required({ validator: s => s.startsWith("a") }) prop3: string;
            }
            it("warnings are shown when required props are not passed", function() {
                const c = createComponent(Validation, {});
                assert(warns.length === 3);
                const [w1, w2, w3] = warns;
                assert(/^Missing required .* "prop1"/.test(w1));
                assert(/^Missing required .* "prop2"/.test(w2));
                assert(/^Missing required .* "prop3"/.test(w3));
            });
            it("warnings are shown when additional valiation fails", function() {
                const c = createComponent(Validation, { prop1: "apple", prop2: "orange", prop3: "grape" });
                assert(warns.length === 1);
                assert(/^Invalid prop: custom validator .* "prop3"/.test(warns[0]));
            });
        });

        describe("validation - auto validation from design type", function () {

            @component({ template: `<div>test</div>` })
            class Validation extends Vue {
                @prop str: string;
                @prop num: number;
                @prop bool: boolean;
                @prop arr: number[];
                @prop func: (v: number) => number;
                @prop({ type: null }) withoutCheck: string;
                @prop({ type: Number }) mismatchType: string;
            }

            const Root = Vue.extend({
                template: `<div>
                             <target ref="target"
                               :str="str" :num="num" :bool="bool" :arr="arr" :func="func"
                               :without-check="withoutCheck" :mismatch-type="mismatchType" />
                           </div>`,
                components: { target: Validation }
            });

            it("values of design types are accepted", function () {
                const root = createComponent(Root, {}, {
                    str: "s", num: 1, bool: true, arr: [1, 2, 3], func: v => v * 2, withoutCheck: "s", mismatchType: "s"
                });
                const c = root.$refs["target"] as Validation;
                assert(c.str === "s");
                assert(c.num === 1);
                assert(c.bool === true);
                assert.deepEqual(c.arr, [1, 2, 3]);
                assert(c.func(1) === 2);
                assert(c.withoutCheck === "s");
                assert(c.mismatchType === "s");
                assert(warns.length === 1);
                assert(/^Invalid prop: type check .* "mismatchType"/.test(warns[0]));
            });

            it("values of other types are rejected", function () {
                // this assert fails now, maybe because bug of vue 2.0.1
                const root = createComponent(Root, {}, {
                    str: 1, num: "s", bool: 1, arr: 1, func: 1, withoutCheck: 1, mismatchType: 1
                });
                assert(warns.length === 5);
                const [w1, w2, w3, w4, w5] = warns;
                assert(/^Invalid prop: type check .* "str"/.test(w1));
                assert(/^Invalid prop: type check .* "num"/.test(w2));
                assert(/^Invalid prop: type check .* "bool"/.test(w3));
                assert(/^Invalid prop: type check .* "arr"/.test(w4));
                assert(/^Invalid prop: type check .* "func"/.test(w5));
            });
        });
    });

    describe("methods", function () {
        @component({ template: `<div>test</div>` })
        class Base extends Vue {
            value: number;
            data(): any { return { value: 1 }; }
            twice() {
                return this.value * 2;
            }
        };
        it("methods are registered as 'methods'", function () {
            const c = createComponent(Base);
            assert(c.twice() === 2);
            c.$destroy();
        });
    });

    describe("computed", function () {
        @component({ template: `<div>test</div>` })
        class Base extends Vue {
            value: string;
            data() {
                return { value: "" };
            }
            get upper(): string {
                return this.value.toUpperCase();
            }
            set upper(value: string) {
                this.value = value.toLowerCase();
            }
        }
        it("properties with get/set are registered as 'computed'", function () {
            const c = createComponent(Base, {}, { value: "old" });
            assert(c.upper === "OLD");
            c.upper = "NEW";
            assert(c.value === "new");
        });
    });

    describe("watch", function () {
        @component({ template: `<div>test</div>` })
        class Base extends Vue {
            value: number;
            history: any[];
            messages: string[];
            data() {
                return { value: 1, history: [], messages: [] };
            }
            @watch("value")
            watchValue(value: number, oldValue: number) {
                this.history.push([value, oldValue]);
            }
        }
        it("methods annotated by @watch are called when data changed", function (done) {
            const c = createComponent(Base);
            c.value = 2;
            // if I use Vue.nextTick() instead of setTimeout(), test will time out when assertion fails
            setTimeout(function() {
                assert.deepEqual(c.history, [[2, 1]]);
                done();
            }, 100);
        });
    });

    describe("vue 2.0 components", function () {
        it("component with render method", function() {
            @component()
            class MyComponent extends Vue {
                @prop prop1: string;
                render(h) {
                    return h("div", [ this.prop1 ]);
                }
            };
            const c = createComponent(MyComponent, { prop1: "test" });
            assert(c.$el.outerHTML === "<div>test</div>");
        });
        it("component with compiledTemplate", function() {
            @component({
                compiledTemplate: compileTemplate("<div>{{ prop1 }}</div>")
            })
            class MyComponent extends Vue {
                @prop prop1: string;
            };
            const c = createComponent(MyComponent, { prop1: "test" });
            assert(c.$el.outerHTML === "<div>test</div>");
        });
        it("component with render and staticRenderFns", function() {
            const { render, staticRenderFns } = compileTemplate("<div>{{ prop1 }}</div>");
            @component({
                render, staticRenderFns
            })
            class MyComponent extends Vue {
                @prop prop1: string;
            };
            const c = createComponent(MyComponent, { prop1: "test" });
            assert(c.$el.outerHTML === "<div>test</div>");
        });
        describe("functional component", function() {
            @functionalComponent
            class MyFunctionalComponent {
                @prop a: string;
                @prop.default("b-default") b: string;
                @prop.required c: number;
                render(h, context) {
                    return h("div", [
                        h("span", { staticClass: "A" }, [this.a]),
                        h("span", { staticClass: "B" }, [this.b]),
                        h("span", { staticClass: "C" }, [this.c]),
                    ]);
                }
            }
            it("basic test", function() {
                const Root = Vue.extend({
                    render(h) {
                        return h(MyFunctionalComponent, { props: { a: "a-value", b: "b-value", c: 100 } });
                    }
                });
                const $ = querySelectorOf(createComponent(Root).$el);
                assert($(".A").innerText === "a-value");
                assert($(".B").innerText === "b-value");
                assert($(".C").innerText === "100");
            });
            it("default value", function() {
                const Root = Vue.extend({
                    render(h) {
                        return h(MyFunctionalComponent, { props: { a: "a-value", c: 100 } });
                    }
                });
                const $ = querySelectorOf(createComponent(Root).$el);
                assert($(".B").innerText === "b-default");
            });
            it("required", function() {
                const Root = Vue.extend({
                    render(h) {
                        return h(MyFunctionalComponent, { props: { a: "a-value" } });
                    }
                });
                const $ = querySelectorOf(createComponent(Root).$el);
                assert($(".C").innerText === "");
                assert(warns.length === 1);
                assert(/^Missing required .* "c"/.test(warns[0]));
            });
            it("type validation", function() {
                const Root = Vue.extend({
                    render(h) {
                        return h(MyFunctionalComponent, { props: { a: 100, b: 100, c: "c-value" } });
                    }
                });
                const $ = querySelectorOf(createComponent(Root).$el);
                assert($(".A").innerText === "100");
                assert($(".B").innerText === "100");
                assert($(".C").innerText === "c-value");
                assert(warns.length === 3);
                const [w1, w2, w3] = warns;
                assert(/^Invalid prop: type check .* "a"/.test(w1));
                assert(/^Invalid prop: type check .* "b"/.test(w2));
                assert(/^Invalid prop: type check .* "c"/.test(w3));
            });
        });
    });
});
