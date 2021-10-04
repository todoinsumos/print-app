
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require("terser-webpack-plugin");

const {
	NODE_ENV = 'production',
} = process.env;

module.exports = {
	entry: './src/index.ts',
	mode: NODE_ENV,
	target: 'node',
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'index.js'
	},
	resolve: {
		extensions: [ '.ts', '.js' ],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					'ts-loader',
				]
			}
		]
	},
	externals: [ nodeExternals() ],
	watch: NODE_ENV === 'development',
	optimization: {
		minimize: true,
		minimizer: [ new TerserPlugin() ],
	},
}
