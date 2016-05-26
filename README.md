# vueit

Decorators to make vuejs component from typescript class.

based on vue-class-component (https://github.com/vuejs/vue-class-component)

## Example

```ts
import {component, prop, p, pr, watch, on} from "vueit";

@component({
    template: `<div>...</div>`
})
class MyComponent extends Vue {
    // data member must be declared as a property (because compiler must know it)
    msg: string;
    data() {
        return { msg: "hello, world" };
    }
    // properties marked by @prop() will be props
    // if "emitDecoratorMetadata" is true, type validation also be set.
    // @p / @pr are shorthand of @prop() / @prop({ require: true })
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
    // @on() will register decorated method to "events"
    @on("bye")
    sayGoodBye() {
        console.log("goodbye!");
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

## LICENSE
MIT
