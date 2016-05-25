declare namespace vueit {
    interface WatchOption {
        name: string;
        deep?: boolean;
        immediate?: boolean;
    }

    interface Static {
        component: (option?: vuejs.ComponentOption) => ClassDecorator;
        prop: (option?: vuejs.PropOption) => PropertyDecorator;
        p: PropertyDecorator;
        pr: PropertyDecorator;
        pd: (defaultValue: any) => PropertyDecorator;
        watch: (option: string|WatchOption) => PropertyDecorator;
        on: (name: string) => PropertyDecorator;
    }
}

declare const vueit: vueit.Static;
export = vueit;

