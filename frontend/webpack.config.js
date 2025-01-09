const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
        }
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
          },
        ],
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets/'),
    }
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./public/index.html",
      filename: "./index.html"
    }),
    new Dotenv({
      systemvars: true
    })
  ],
  devServer: {
    allowedHosts: 'all',
    hot: true,
    port: 2001
  }  
};