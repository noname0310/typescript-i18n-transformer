import copyWebpackPlugin from "copy-webpack-plugin";
import eslintPlugin from "eslint-webpack-plugin";
import htmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import type ts from "typescript";
import i18nMinifyTransformer from "typescript-i18n-transformer";
import type webpack from "webpack";
// import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import type { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

export default (env: any): webpack.Configuration & { devServer?: WebpackDevServerConfiguration } => ({
    entry: "./src/index.tsx",
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "[name].bundle.js",
        clean: true
    },
    optimization: {
        minimize: false
    },
    cache: true,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env"
                            ],
                            targets: {
                                browsers: ["current node"]
                            },
                            plugins: [
                                [
                                    "babel-plugin-styled-components",
                                    {
                                        displayName: !env.production,
                                        minify: true
                                    }
                                ]
                            ]
                        }
                    },
                    {
                        loader: "ts-loader",
                        options: {
                            getCustomTransformers: (program: ts.Program) => ({
                                before: [
                                    i18nMinifyTransformer(program)
                                ]
                            })
                        }
                    }
                ]
            },
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false
                }
            },
            {
                test: /\.html$/,
                loader: "html-loader",
                options: {
                    esModule: false
                }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(ico|png|jp?g|svg)$/,
                type: "asset/resource"
            }
        ]
    },
    resolve: {
        alias: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "@": path.resolve(__dirname, "src")
        },
        modules: ["src", "node_modules"],
        extensions: [".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: ([
        new htmlWebpackPlugin({
            template: "./src/index.html"
        }),
        new eslintPlugin({
            extensions: ["ts", "tsx"],
            fix: true,
            cache: true,
            configType: "flat"
        }),
        new copyWebpackPlugin({
            patterns: [
                { from: "res", to: "res" }
            ]
        })
        // new BundleAnalyzerPlugin()
    ]),
    devServer: {
        host: "0.0.0.0",
        port: 8080,
        allowedHosts: "all",
        client: {
            logging: "none"
        },
        hot: true,
        watchFiles: ["src/**/*"]
    },
    mode: env.production ? "production" : "development"
});
