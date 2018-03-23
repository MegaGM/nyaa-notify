'use strict'
const
  path = require('path'),
  webpack = require('webpack'),
  ExtractTextPlugin = require('extract-text-webpack-plugin')

function resolve(dir) {
  return path.join(__dirname, dir)
}

let plugins = [
  new ExtractTextPlugin('[name].css'),
  new webpack.SourceMapDevToolPlugin({
    filename: '[file].map'
  }),
]

const env = process.env.NODE_ENV
console.info('WEBPACK_ENV: ', env)

module.exports = [{
  name: 'nyaa-notify',
  stats: {
    children: false,
  },
  target: 'node',
  node: {
    fs: 'empty',
    // querystring: 'empty',
  },
  entry: {
    bundle: './src/entry.js',
  },
  output: {
    path: path.resolve(__dirname, 'bundles'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    }
  },
  module: {
    rules: [{
        test: /.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/i,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader'],
        })
      },
    ]
  },
  plugins,
}]
