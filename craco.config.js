// craco.config.js
const path = require("path");
require("dotenv").config();

// Create React App n'injecte dans le bundle client que les variables préfixées
// `REACT_APP_`. Les noms documentés dans `.env.example` (et donc ceux saisis sur
// Vercel) sont sans préfixe : on les expose explicitement ici via DefinePlugin.
// Ajoutez-y toute nouvelle variable à lire depuis `process.env` côté client.
const CLIENT_ENV_VARS = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
  "FIREBASE_MEASUREMENT_ID",
  "ADMIN_UID",
  "SITE_URL",
  "DISCORD_CLIENT_ID",
  "STEAM_API_KEY",
  "TWITCH_CLIENT_ID",
  "SEARCH_HOST",
  "SEARCH_KEY",
];

function clientEnvDefinitions() {
  const definitions = {};
  for (const name of CLIENT_ENV_VARS) {
    const value = process.env[name] ?? process.env[`REACT_APP_${name}`];
    if (value !== undefined && value !== "") definitions[`process.env.${name}`] = JSON.stringify(String(value));
  }
  return definitions;
}

// webpack-dev-server v5 (imposé par les overrides pour Node ≥ 20) a changé d'API :
// on traduit les options v4 attendues par react-scripts vers leur équivalent v5.
function makeDevServerV5Compatible(devServerConfig) {
  const { https, onAfterSetupMiddleware, onBeforeSetupMiddleware, onListening, setupMiddlewares, ...compatibleConfig } = devServerConfig;

  compatibleConfig.server = typeof https === "object" ? { type: "https", options: https } : https ? "https" : "http";
  compatibleConfig.headers = {
    ...compatibleConfig.headers,
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (onBeforeSetupMiddleware || setupMiddlewares) {
    compatibleConfig.setupMiddlewares = (middlewares, devServer) => {
      if (onBeforeSetupMiddleware) onBeforeSetupMiddleware(devServer);
      return setupMiddlewares ? setupMiddlewares(middlewares, devServer) : middlewares;
    };
  }

  compatibleConfig.onListening = (devServer) => {
    devServer.close ??= (callback) => devServer.stopCallback(callback);
    if (onListening) onListening(devServer);
    if (onAfterSetupMiddleware) onAfterSetupMiddleware(devServer);
  };

  return compatibleConfig;
}

const webpackConfig = {
  // Jest 27 (react-scripts 5) ne résout pas le champ `exports` des paquets
  // react-router v7 → les tests qui importent react-router-dom échouaient avec
  // « Cannot find module ». On pointe explicitement les builds CJS.
  jest: {
    configure: (jestConfig) => {
      jestConfig.moduleNameMapper = {
        ...jestConfig.moduleNameMapper,
        // Alias @/ (déjà géré par webpack via `alias`) pour les tests.
        "^@/(.*)$": path.join(__dirname, "src", "$1"),
        // Chemins absolus : les sous-chemins ne sont pas exposés par `exports`.
        "^react-router-dom$": path.join(__dirname, "node_modules", "react-router-dom", "dist", "index.js"),
        "^react-router/dom$": path.join(__dirname, "node_modules", "react-router", "dist", "development", "dom-export.js"),
        "^react-router$": path.join(__dirname, "node_modules", "react-router", "dist", "development", "index.js"),
      };
      return jestConfig;
    },
  },
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig) => {
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/build/**", "**/dist/**", "**/coverage/**", "**/public/**"],
      };

      // Expose les variables sans préfixe REACT_APP_ au code client (cf. .env.example)
      const clientEnv = clientEnvDefinitions();
      if (Object.keys(clientEnv).length > 0) {
        const webpack = require("webpack");
        webpackConfig.plugins.push(new webpack.DefinePlugin(clientEnv));
      }

      return webpackConfig;
    },
  },
};

webpackConfig.devServer = (devServerConfig) => makeDevServerV5Compatible(devServerConfig);

module.exports = webpackConfig;
