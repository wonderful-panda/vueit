var path = require("path");

module.exports = {
    context: path.join(__dirname, "lib"),
    entry: "./index.ts",
    output: {
        library: "vueit",
        libraryTarget: "umd",
        path: path.join(__dirname, "dist"),
        filename: "index.js"
    },
    devtool: 'source-map',
    resolve: {
        extensions: ["", ".ts", ".js"],
        root: path.join(__dirname, "lib")
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: "babel-loader?presets[]=es2015!ts-loader" },
        ]
    },
    externals: [
        "vue",
        "reflect-metadata"
    ]
};
