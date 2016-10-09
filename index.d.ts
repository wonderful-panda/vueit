import * as Vue from "vue";
import * as types from "./types";

declare namespace vueit {
    interface Static {
        component<V extends Vue>(option?: types.ComponentOptions<V>): ClassDecorator;
        prop: (option?: Vue.PropOptions) => PropertyDecorator;
        p: PropertyDecorator;
        pr: PropertyDecorator;
        pd: (defaultValue: any) => PropertyDecorator;
        watch: (option: string|types.WatchOptions) => PropertyDecorator;
    }
}

declare const vueit: vueit.Static;
export = vueit;

