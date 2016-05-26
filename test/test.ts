"use strict";
import * as assert from "power-assert";
import * as Vue from "vue";
import { component, prop, p, pd, watch, on } from "../lib/index";
import { jsdom } from "jsdom";


global["document"] = jsdom(`<html><body /></html>`);
global["window"] = document.defaultView;
Vue.config.async = false;

describe("vueit", function () {

    let components: any[];
    beforeEach(function () {
        components = [];
    });
    afterEach(function () {
        components.forEach(c => { c.$destroy(); });
        assert(components.length === 0);
    });
    function createComponent<T>(C: new (o: vuejs.ComponentOption) => T, propsData?: Object, data?: Object): T {
        const c = new C({
            el: document.createElement("div"),
            beforeDestroy: function () {
                components.$remove(this);
            },
            data: data,
            propsData: propsData
        });
        components.push(c);
        return c;
    }

    describe("hooks", function () {
        @component()
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
        @component()
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

        @component()
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
                         <target v-ref:target
                           :str="str" :num="num" :bool="bool" :arr="arr" :func="func"
                           :without-check="withoutCheck" :mismatch-type="mismatchType" />
                       </div>`,
            components: { target: Validation }
        });

        describe("validation - auto validation from design type", function () {
            Vue.config.silent = true;
            after(function () {
                Vue.config.silent = false;
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
                assert(c.mismatchType === undefined, "rejected because of wrong validator");
            });

            it("values of other types are rejected", function () {
                const root = createComponent(Root, {}, {
                    str: 1, num: "s", bool: 1, arr: 1, func: 1, withoutCheck: 1, mismatchType: 1
                });
                const c = root.$refs["target"] as Validation;
                assert(c.str === undefined);
                assert(c.num === undefined);
                assert(c.bool === undefined);
                assert(c.arr === undefined);
                assert(c.func === undefined);
                assert(c.withoutCheck as any === 1, "accepted because of null validator");
                assert(c.mismatchType as any === 1, "accepted because of wrong validator");
            });
        });
    });

    describe("methods", function () {
        @component()
        class Base extends Vue {
            value: number;
            data(): any { return { value: 1 }; }
            twice() {
                return this.value * 2;
            }
        };
        it("methods are registered as 'methods'", function () {
            const c = createComponent(Base);
            assert(c.$interpolate("{{ twice() }}") === "2");
            c.$destroy();
        });
    });

    describe("computed", function () {
        @component()
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

    describe("watch and events", function () {
        @component()
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
            @on("message")
            onMessage(msg: string) {
                this.messages.push(msg);
            }
        }
        it("methods annotated by @watch are called when data changed", function () {
            const c = createComponent(Base);
            c.value = 2;
            c.value = 3;
            assert.deepEqual(c.history, [[2, 1], [3, 2]]);
        });
        it("methods annotated by @on are called when specified event emitted", function () {
            const c = createComponent(Base);
            c.$emit("message", "hello");
            assert.deepEqual(c.messages, ["hello"]);
        });
    });
});
