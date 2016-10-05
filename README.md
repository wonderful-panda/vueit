# vueit

Decorators to make vuejs component from typescript class.

based on vue-class-component (https://github.com/vuejs/vue-class-component)

## Requirement

Vue >= 2.0.1

## Example

```ts
import {component, prop, p, pr, watch} from "vueit";

interface MyComponentData {
    msg: String;
}

@component({
    template: `<div>...</div>`
})
class MyComponent extends Vue {
    // It's recommended to declare $data explicitly.
    // This makes data() and data member access safe.
    $data: MyComponentData;

    data(): MyComponentData {
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
        console.log(this.$data.msg);
    }
    // properties with getter and/or setter will be registered to "computed"
    get computedMsg() {
        return `computed ${this.$data.msg}`;
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

## LICENSE
MIT
