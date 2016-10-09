declare module "vue-template-compiler" {
    var compile: (source: string) => { render: string, staticRenderFns: string[], errors: any[] };
}
