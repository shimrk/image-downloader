const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            background: './src/background.ts',
            content: './src/content.ts',
            popup: './src/popup.ts',
            options: './src/options.ts'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: 'public', to: '.' },
                    { from: 'manifest.json', to: '.' }
                ]
            }),
            new HtmlWebpackPlugin({
                template: './src/popup.html',
                filename: 'popup.html',
                chunks: ['popup']
            }),
            new HtmlWebpackPlugin({
                template: './src/options.html',
                filename: 'options.html',
                chunks: ['options']
            })
        ],
        devtool: isProduction ? false : 'cheap-module-source-map',
        optimization: {
            splitChunks: {
                chunks: 'all'
            }
        }
    };
}; 