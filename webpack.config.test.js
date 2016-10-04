var path = require("path");

module.exports = {
    context: path.join(__dirname, "test"),
    entry: "./test.ts",
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
            { test: /\.ts$/, loader: "babel-loader?presets[]=es2015!ts-loader" },
            { test: /\.json$/, loader: "json-loader" },
        ],
        postLoaders: [
            { test: /test\.ts$/, loader: "webpack-espower-loader" },
        ]
    }
};
