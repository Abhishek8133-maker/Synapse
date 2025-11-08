const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    entry: {
      background: './src/background/index.ts',
      content: './src/content/index.tsx',
      popup: './src/popup/index.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@synapse/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
        '@synapse/ui': path.resolve(__dirname, '../../packages/ui/src'),
        '@synapse/utils': path.resolve(__dirname, '../../packages/utils/src'),
      },
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'manifest.json', to: '.' },
          { from: 'icons', to: 'icons' },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),
    ],
    optimization: {
      splitChunks: false, // Important for Chrome extensions
    },
    devtool: isProduction ? false : 'cheap-module-source-map',
    watchOptions: {
      ignored: /node_modules/,
    },
  }
}