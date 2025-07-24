/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

const urlDev = "https://localhost:3000/";
const urlProd = "https://staging-outlook-ebcontrol.web.app/"; // CHANGE THIS TO YOUR PRODUCTION DEPLOYMENT LOCATION

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = [
    {
      devtool: "source-map",
      entry: {
        polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
        vendor: ["react", "react-dom", "core-js", "@fluentui/react"],
        decrypt: ["react-hot-loader/patch", "./src/decrypt/index.tsx", "./src/decrypt/decrypt.html"],
        encrypt: ["react-hot-loader/patch", "./src/encrypt/index.tsx", "./src/encrypt/encrypt.html"],
        popupDecrypted: [
          "react-hot-loader/patch",
          "./src/pages/PopupDecrypted/index.tsx",
          "./src/pages/PopupDecrypted/popupDecrypted.html",
        ],
        accounts: ["react-hot-loader/patch", "./src/pages/Accounts/index.tsx", "./src/pages/Accounts/accounts.html"],
        fallbackauthdialog: "./src/helpers/fallbackauthdialog.ts",
        commands: "./src/commands/commands.ts",
      },
      resolve: {
        extensions: [".ts", ".tsx", ".html", ".js", ".css", ".scss"],
        fallback: {
          buffer: require.resolve("buffer/"),
          http: require.resolve("stream-http"),
          https: require.resolve("https-browserify"),
          url: require.resolve("url/"),
        },
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: ["@babel/preset-typescript"],
              },
            },
          },
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: ["react-hot-loader/webpack", "ts-loader"],
          },
          {
            test: /\.html$/,
            exclude: /node_modules/,
            use: "html-loader",
          },
          {
            test: /\.(png|jpg|jpeg|svg|gif|ico)$/,
            type: "asset/resource",
            generator: {
              filename: "assets/[name][ext][query]",
            },
          },
          {
            test: /\.(s?)css$/,
            use: ["style-loader", "css-loader", "sass-loader"],
          },
        ],
      },
      plugins: [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: "assets/*",
              to: "assets/[name][ext][query]",
            },
            {
              from: "manifest*.xml",
              to: "[name]" + "[ext]",
              transform(content) {
                if (dev) {
                  return content;
                } else {
                  return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
                }
              },
            },
          ],
        }),
        new HtmlWebpackPlugin({
          filename: "decrypt.html",
          template: "./src/decrypt/decrypt.html",
          chunks: ["decrypt", "vendor", "polyfills"],
        }),
        new HtmlWebpackPlugin({
          filename: "encrypt.html",
          template: "./src/encrypt/encrypt.html",
          chunks: ["encrypt", "vendor", "polyfills"],
        }),
        new HtmlWebpackPlugin({
          filename: "popupDecrypted.html",
          template: "./src/pages/PopupDecrypted/popupDecrypted.html",
          chunks: ["popupDecrypted", "vendor", "polyfills"],
        }),
        new HtmlWebpackPlugin({
          filename: "accounts.html",
          template: "./src/pages/Accounts/accounts.html",
          chunks: ["accounts", "vendor", "polyfills"],
        }),
        new HtmlWebpackPlugin({
          filename: "fallbackauthdialog.html",
          template: "./src/helpers/fallbackauthdialog.html",
          chunks: ["fallbackauthdialog", "vendor", "polyfills"],
        }),
        new HtmlWebpackPlugin({
          filename: "commands.html",
          template: "./src/commands/commands.html",
          chunks: ["commands"],
        }),
        new webpack.ProvidePlugin({
          Promise: ["es6-promise", "Promise"],
        }),
        new Dotenv({
          path: ".env",
        }),
        new CopyWebpackPlugin({
          patterns: [
            {
              from: ".env",
              to: ".",
            },
          ],
        }),
      ],
      devServer: {
        hot: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        server: {
          type: "https",
          options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
        },
        port: process.env.npm_package_config_dev_server_port || 3000,
      },
    }
  ];

  return config;
};
