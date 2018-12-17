const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const webpack = require(`webpack`);
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = (env, {mode}) => {
  console.log(mode);
  return {
    entry: {
      desktop: './src/js/script.js',
      mobile: ['babel-polyfill', './src/js/controllerScript.js']
    },
    output: {
      filename: '[name].[hash].js'
    },
    devServer: {
      overlay: true,
      hot: true,
      contentBase: './src'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-srcsets-loader',
              options: {
                attrs: [
                  `img:src`,
                  `audio:src`,
                  `video:src`,
                  `source:srcset`
                ]
              }
            }
          ]
        },
        {
          test: /\.txt$/,
          use: [
            {
              loader: 'raw-loader',
            }
          ]
        },
        {
          test: /\.(jpe?g|png|svg|webp|mp3)$/,
          use: {
            loader: 'file-loader',
            options: {
              // limit: 1,
              context: './src',
              name: '[path][name].[ext]',
              attrs: [
                `img:src`,
                `audio:src`,
                `video:src`,
                `source:srcset`
              ]
            }
          }
        },
        {
          test: /\.(mp3)$/,
          use: {
            loader: 'file-loader',
            options: {
              // limit: 1,
              context: './src',
              name: '[path][name].[ext]'
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            mode === 'production'
              ? MiniCssExtractPlugin.loader
              : 'style-loader',
            'css-loader',
            'resolve-url-loader',
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                plugins: [
                  require('postcss-import'),
                  postcssPresetEnv({stage: 0})
                ]
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebPackPlugin({
        template: './src/index.html',
        filename: './index.html',
        chunks: ['desktop']
      }),
      new HtmlWebPackPlugin({
        template: './src/controller.html',
        filename: './controller.html',
        chunks: ['mobile']
      }),
      new MiniCssExtractPlugin({
        filename: 'style.[contenthash].css'
      }),
      new CopyWebpackPlugin([
        {from: './src/model2', to: 'model2'},
        {from: './src/data', to: 'data'},
        {from: './src/mini_classes.txt', to: ''},
        {from: './src/assets/audio', to: 'assets/audio'},
        {from: './src/assets/models', to: 'assets/models'},
      ]),
      new OptimizeCSSAssetsPlugin(),
      new webpack.HotModuleReplacementPlugin()
    ]
  };
  

  
};
