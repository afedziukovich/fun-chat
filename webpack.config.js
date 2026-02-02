const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';
  const repositoryName = 'fun-chat';

  return {
    entry: './src/index.ts',
    output: {
      filename: 'bundle.[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: isGitHubPages ? `/${repositoryName}/` : '/'
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, './'),
          publicPath: '/'
        },
        {
          directory: path.join(__dirname, 'src'),
          publicPath: '/src'
        }
      ],
      compress: true,
      port: 8082,
      historyApiFallback: true,
      hot: true
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'sass-loader'
          ]
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './index.html',
        favicon: './public/favicon.svg'
      }),
      new MiniCssExtractPlugin({
        filename: 'styles.[contenthash].css'
      }),
      new CopyPlugin({
        patterns: [
          { from: 'public', to: 'public' },
          { from: '_redirects', to: '.' }
        ]
      })
    ]
  };
};