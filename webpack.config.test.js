var path = require("path");
var nodeExternals = require("webpack-node-externals");

module.exports = {
    context: path.join(__dirname, "test"),
    entry: "./test.ts",
    target: "node",
    externals: [nodeExternals({
        whitelist: ["vue"]
    })],
    output: {
        path: path.join(__dirname, "test/dist"),
        filename: "build.js"
    },
    devtool: 'source-map',
    resolve: {
        extensions: ["", ".ts", ".js"],
        root: path.join(__dirname, "test"),
        alias: {
            vue: "vue/dist/vue.js"
        }
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: "ts-loader" },
        ],
        postLoaders: [
            { test: /test\.ts$/, loader: "webpack-espower-loader" },
        ]
    }
};
