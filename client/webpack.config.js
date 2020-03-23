const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: ['react-hot-loader/patch', './src/index.js'],
    watch: true,
    target: 'web',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /.jsx?$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
        }),
        new webpack.HotModuleReplacementPlugin()
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'server.js',
        publicPath: '/',
    },
    devServer: {
        proxy: { // proxy URLs to backend development server
            '/api': 'http://localhost:3000'
        },
        // contentBase: path.join(__dirname, 'public'), // boolean | string | array, static file location
        // compress: true, // enable gzip compression
        historyApiFallback: true, // true for index.html upon 404, object for multiple paths
        hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
        port: 8000,
        open: true,
    }
};