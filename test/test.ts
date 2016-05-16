import * as assert from "power-assert";
import * as Vue from "vue";
import { component, prop } from "../lib/index";
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
            @prop()
            msg1: string;
            @prop({ default: "value2default" })
            msg2: string;
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
            @prop({ default: "value2extended" })
            msg2: string;
            @prop()
            msg3: string;
        }
        it("extended - props from both Basic and Extended are enabled", function () {
            const c = createComponent(Extended, { msg1: "value1", msg3: "value3" });
            assert(c.msg1 === "value1");
            assert(c.msg2 === "value2extended");
            assert(c.msg3 === "value3");
        });

        @component()
        class Validation extends Vue {
            @prop()
            str: string;
            @prop()
            num: number;
            @prop()
            arr: number[];
            @prop()
            func: (v: number) => number;
            @prop({ type: null })
            withoutCheck: string;
            @prop(Number)
            mismatchType: string;
        }

        const Root = Vue.extend({
            template: `<div>
                         <target v-ref:target
                           :str="str" :num="num" :arr="arr" :func="func"
                           :without-check="withoutCheck" :mismatch-type="mismatchType" />
                       </div>`,
            data: { str: null, num: null, arr: null, func: null, withoutCheck: null, mismatchType: null },
            components: { target: Validation }
        });

        describe("validation - auto validation from design type", function () {
            Vue.config.silent = true;
            after(function () {
                Vue.config.silent = false;
            });
            it("values of design types", function () {
                const root = createComponent(Root, {}, {
                    str: "s", num: 1, arr: [1, 2, 3], func: v => v * 2, withoutCheck: "s", mismatchType: "s"
                });
                const c = root.$refs["target"] as Validation;
                assert(c.str === "s");
                assert(c.num === 1);
                assert.deepEqual(c.arr, [1, 2, 3]);
                assert(c.func(1) === 2);
                assert(c.withoutCheck === "s");
                assert(c.mismatchType === undefined, "rejected because of wrong validator");
            });

            it("values of other types", function () {
                const root = createComponent(Root, {}, {
                    str: 1, num: "s", arr: 1, func: 1, withoutCheck: 1, mismatchType: 1
                });
                const c = root.$refs["target"] as Validation;
                assert(c.str === undefined);
                assert(c.num === undefined);
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
        it("basic", function () {
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
        it("basic", function () {
            const c = createComponent(Base, {}, { value: "old" });
            assert(c.upper === "OLD");
            c.upper = "NEW";
            assert(c.value === "new");
        });
    });
});
