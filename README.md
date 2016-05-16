# vueit

Decorators to make vuejs component from typescript class.

based on vue-class-component (https://github.com/vuejs/vue-class-component)

## Example

```ts
import * as vueit from "vueit";

@vueit.component({
    template: `<div>...</div>`
})
class MyComponent extends Vue {
    msg: string;

    @vueit.prop()
    prop1: string;

    data() {
        return { msg: "hello, world" };
    }

    ready() {
        console.log("ready!");
    }

    get computedMsg() {
        return `computed ${this.msg}`;
    }
}
```

is equivalent to

```js
const MyComponent = Vue.extend({
    template: `<div>...</div>`,
    props: {
        prop1: String
    },
    data: function() {
        return { msg: "hello, world" };
    },
    ready: function() {
        console.log("ready!");
    },
    computed: {
        computedMsg: function() {
            return `computed ${this.msg}`;
        }
    }
});
```

## LICENSE
MIT
