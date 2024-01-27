const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: "inline-source-map",
  entry: {
    main: "./src/main.js",
    util: "./src/util.js",
    content: "./src/content.js",
    background: "./src/background.js"
  },
  plugins: [
    new HtmlWebpackPlugin({
        template: "./src/main.html",
        filename: "main.html",
        chunks: ['main']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, "public"),
          to: path.resolve(__dirname, "ask-genie")
       }, {
	  from: path.resolve(__dirname, "src", "setup.json"),
	  to: path.resolve(__dirname, "ask-genie")
       }
      ]
    }),
    new NodePolyfillPlugin()
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'ask-genie'),
    clean: true,
  },
  module: {
    rules: [
      {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react']
        }
      }
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.(scss|css)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  }
};
