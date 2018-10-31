const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const lambdaDir = 'src/lambdas';
const lambdaSourceFiles = fs.readdirSync(path.join(__dirname, lambdaDir))
  .reduce((accum, f) => {
    accum[f] = path.join(__dirname, lambdaDir, f, '/index.ts');
    return accum;
  }, {});

module.exports = {
  entry: lambdaSourceFiles,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ],
    exprContextCritical: false
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  output: {
    filename: '[name]/index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs'
  },
  target: 'node',
  plugins: [new webpack.IgnorePlugin(/^electron$/)],
};
