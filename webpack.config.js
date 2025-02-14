const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');
const { library } = require("webpack");

module.exports = {
    entry: {
        index: path.resolve(__dirname, 'src/index.ts')
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'ts-loader'
            }
        ]
    },
    resolve: { extensions: ['.ts', '.js'] },
    output: {
        chunkFilename: '[name].js',
        filename: '[name].js',
        clean: true,
        library: {
            type: 'umd'
        }
    },

    mode: 'development',
    // plugins: [new TerserPlugin()],
    devtool: 'source-map'
}