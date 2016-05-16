declare namespace vueit {
    type PropOption = vuejs.PropOption | (new (...args: any[]) => any) | (new (...args: any[]) => any)[];
    interface WatchOption {
        name: string;
        deep?: boolean;
        immediate?: boolean;
    }

    interface Static {
        component: (option?: vuejs.ComponentOption) => ClassDecorator;
        prop: (option?: PropOption) => PropertyDecorator;
        watch: (option: string|WatchOption) => PropertyDecorator;
    }
}

declare const v: vueit.Static;
declare module "vueit" {
    export = v;
}

