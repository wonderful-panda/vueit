# vueit

Decorators to make vuejs component from typescript class.

based on vue-class-component (https://github.com/vuejs/vue-class-component)

## Requirement

Vue >= 2.0.1

## Example

```ts
import {component, prop, p, pr, watch} from "vueit";

@component({
    template: `<div>...</div>`
})
class MyComponent extends Vue {
    data() {
        return { msg: "hello, world" };
    }
    // properties marked by @prop() will be props
    // if "emitDecoratorMetadata" is true, type validation also be set.
    // @p / @pr are shorthand of @prop() / @prop({ required: true })
    @prop()
    prop1: string;

    @prop({ default: true })
    prop2: boolean;

    @p prop3: string;
    @pr prop4: string;

    // methods with known name(data, created, ready, etc) will be registered as hooks
    ready() {
        console.log("ready!");
    }
    // methods with unknown name are registered as "methods"
    greet() {
        console.log(this.msg);
    }
    // properties with getter and/or setter will be registered to "computed"
    get computedMsg() {
        return `computed ${this.msg}`;
    }
    // @watch() will register decorated method to "watch"
    @watch("msg")
    onMsgChanged(value: string, oldValue: string) {
        console.log("msg changed!");
    }
}
```

Above code is equivalent to

```js
const MyComponent = Vue.extend({
    template: `<div>...</div>`,
    data: function() {
        return { msg: "hello, world" };
    },
    props: {
        prop1: String,
        prop2: { default: true, type: Boolean },
        prop3: String,
        prop4: { require: true, type: String }
    },
    ready: function () {
        console.log("ready!");
    },
    methods: {
        greet: function() {
            console.log(this.msg);
        }
    },
    computed: {
        computedMsg: function() {
            return `computed ${this.msg}`;
        }
    },
    watch: {
        msg: function(value: string, oldValue: string) {
            console.log("msg changed!");
        }
    },
    events: {
        bye: function() {
            console.log("goodbye!");
        }
    }
});
```

## Tips

### Make `data()` typesafe

When you use `data()`, you also must declare data members as properties
because typescript compiler must know it.

```ts
@component({
    template: `<div>...</div>`
})
class MyComponent extends Vue {
    data() {
        return { msg: "hello, world" };
    }
    // you must declare `msg` as a property to use it in the code.
    msg: String;

    greet() {
        console.log(this.msg);
    }
```

Instead of above code, you can do as below, this is more typesafe than above one.

```ts
// define interface which represents data member of MyComponent
interface MyComponentData {
    msg: string;
}
@component({
    template: `<div>...</div>`
})
class MyComponent extends Vue {
    // define `$data` property
    $data: MyComponentData;

    // declare return type of `data()` explicitly
    data(): MyComponentData {
        return { msg: "hello, world" };
    }

    greet() {
        // you can access `msg` via `$data`.
        console.log(this.$data.msg);
    }
```

### Use Precompiled template

`template` can accept not only plain string, but also output from `vue-template-compiler`.

```ts
@component({
    template : { render: ..., staticRenderFns: [...] }
})
class MyComponent extends Vue {
    ...
}
```

This means you can precompile template by bundler like webpack.

```ts
// vue-template-compiler-loader must be installed
@component({
    template: require("vue-template-compiler!./mycomponent.html")
})
class MyComponent extends Vue {
    ...
}
```

## LICENSE
MIT
