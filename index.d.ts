import * as Vue from "vue";

declare namespace vueit {
    interface WatchOption {
        name: string;
        deep?: boolean;
        immediate?: boolean;
    }

    interface Static {
        component: (option?: Vue.ComponentOptions<Vue>) => ClassDecorator;
        prop: (option?: Vue.PropOptions) => PropertyDecorator;
        p: PropertyDecorator;
        pr: PropertyDecorator;
        pd: (defaultValue: any) => PropertyDecorator;
        watch: (option: string|WatchOption) => PropertyDecorator;
    }
}

declare const vueit: vueit.Static;
export = vueit;

