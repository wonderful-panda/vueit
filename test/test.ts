///<reference types="mocha" />
"use strict";
import * as assert from "power-assert";
import * as Vue from "vue";
import { component, prop, p, pd, watch } from "../lib/index";
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
            @p msg1: string;
            @pd("value2default") msg2: string;
        }
        it("basic", function () {
            const c = createComponent(Basic, { msg1: "value1" });
            assert(c.msg1 === "value1");
            assert(c.msg2 === "value2default");
        });

        it("basic - override default value", function () {
            const c = createComponent(Basic, { msg2: "value2" });
            assert(c.msg2 === "value2");
        });

        @component()
        class Extended extends Basic {
            @pd("value2extended") msg2: string;
            @p msg3: string;
        }
        it("extended - props from both Basic and Extended are enabled", function () {
            const c = createComponent(Extended, { msg1: "value1", msg3: "value3" });
            assert(c.msg1 === "value1");
            assert(c.msg2 === "value2extended");
            assert(c.msg3 === "value3");
        });

        @component({ template: `<div>test</div>` })
        class Validation extends Vue {
            @p str: string;
            @p num: number;
            @p bool: boolean;
            @p arr: number[];
            @p func: (v: number) => number;
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

        describe("validation - auto validation from design type", function () {
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
                assert(warns[0].startsWith(`Invalid prop: type check failed for prop "mismatchType"`));
            });

            it("values of other types are rejected", function () {
                // this assert fails now, maybe because bug of vue 2.0.1
                const root = createComponent(Root, {}, {
                    str: 1, num: "s", bool: 1, arr: 1, func: 1, withoutCheck: 1, mismatchType: 1
                });
                assert(warns.length === 5);
                const [w1, w2, w3, w4, w5] = warns;
                assert(w1.startsWith(`Invalid prop: type check failed for prop "str"`));
                assert(w2.startsWith(`Invalid prop: type check failed for prop "num"`));
                assert(w3.startsWith(`Invalid prop: type check failed for prop "bool"`));
                assert(w4.startsWith(`Invalid prop: type check failed for prop "arr"`));
                assert(w5.startsWith(`Invalid prop: type check failed for prop "func"`));
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
                @p prop1: string;
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
                @p prop1: string;
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
                @p prop1: string;
            };
            const c = createComponent(MyComponent, { prop1: "test" });
            assert(c.$el.outerHTML === "<div>test</div>");
        });
    });
});
