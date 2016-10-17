# vueit

Decorators to make vuejs component from typescript class.

based on vue-class-component (https://github.com/vuejs/vue-class-component)

## Requirement

Vue >= 2.0.1

## Example

### Normal component

```typescript
import {component, prop, watch} from "vueit";

@component<MyComponent>({
    template: `<div>...</div>`,
    beforeDestroy() {
        // Now (typescript >= 2.0), you can access props/data of MyComponent here.
        console.log("beforeDestroy", this.msg);
    }
})
class MyComponent extends Vue {
    msg: string;
    data() {
        return { msg: "hello, world" };
    }
    // properties marked by @prop will be props
    // if "emitDecoratorMetadata" is specified in `tsconfig.json`,
    // type validation will be automatically set for some types
    @prop
    prop1: string;

    @prop.default(true) // same as @prop({ default: true })
    prop2: boolean;

    @prop.required      // same as @prop({ required: true })
    prop3: string;

    @prop.required(validator: s => /^[A-Z]+$/.test(s))
    prop4: string;

    // methods with known name(data, created, mounted, etc) will be registered as hooks
    mounted() {
        console.log("mounted!");
    }
    // methods with unknown name are registered as "methods"
    greet() {
        console.log(this.msg);
    }
    // properties with getter/setter (setter is optional) will be registered to "computed"
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

```javascript
const MyComponent = Vue.extend({
    template: `<div>...</div>`,
    data: function() {
        return { msg: "hello, world" };
    },
    props: {
        prop1: String,
        prop2: { default: true, type: Boolean },
        prop3: { required: true, type: String },
        prop4: { required: true, validator: s => /^[A-Z]+$/.test(s), type: String }
    },
    mounted: function () {
        console.log("mounted!");
    },
    beforeDestroy: function () {
        console.log("beforeDestroy", this.msg);
    },
    methods: {
        greet() {
            console.log(this.msg);
        }
    },
    computed: {
        computedMsg() {
            return `computed ${this.msg}`;
        }
    },
    watch: {
        msg: function(value: string, oldValue: string) {
            console.log("msg changed!");
        }
    }
});
```

### Functional component (Experimental)

```typescript
import {functionalComponent, prop} from "vueit";

@functionalComponent
class MyFunctionalComponent extends Vue {
    static render(h, context, text: string, done: boolean) {
        const style = { textDecoration: (done ? "line-through" : "none") };
        return h("div", { style }, [ text ]);
    }
}
```

Above code is equivalent to

```javascript
const MyFunctionalComponent = Vue.extends({
    name: "MyFunctionalComponent",
    functional: true,
    props: ["text", "done"],
    render(h, context) {
        const text = context.props.text;
        const done = context.props.done;
        const style = { textDecoration: (done ? "line-through" : "none") };
        return h("div", { style }, [ text ]);
    }
});
```

You can use @prop to specify prop options like below.

```typescript
@functionalComponent
class MyFunctionalComponent extends Vue {
    static render(h, context,
                  @prop,required text: string,
                  @prop.default(false) done: boolean) {
        const style = { textDecoration: (done ? "line-through" : "none") };
        return h("div", { style }, [ text ]);
    }
}
```



## Tips

### Make `data()` typesafe

When you use `data()`, you also must declare data members as properties
because typescript compiler must know them.

```typescript
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

```typescript
// define interface which represents data members of MyComponent
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

You can pass output from `vue-template-compiler` to `compiledTemplate` directly.

```typescript
@component({
    compiledTemplate : { render: ..., staticRenderFns: [...] }
})
class MyComponent extends Vue {
    ...
}
```

In other words, if you have installed appropriate plugin for bundler, you can precompile templates in bundle process.

```typescript
// Example for webpack and vue-template-compiler-loader
@component({
    compiledTemplate: require("vue-template-compiler!./mycomponent.html")
})
class MyComponent extends Vue {
    ...
}
```

You also can do like below. `compiledTemplate` is just shorthand.

```typescript
const { render, staticRenderFns } = require("vue-template-compiler!./mycomponent.html");
@component({
    render,
    staticRenderFns
})
class MyComponent extends Vue {
    ...
}
```

## LICENSE
MIT
