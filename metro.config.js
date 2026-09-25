const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');
config.resolver.assetExts.push('wasm');

const prevEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const nextMiddleware = prevEnhance ? prevEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

      const originalWriteHead = res.writeHead;
      res.writeHead = function (statusCode, ...args) {
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        return originalWriteHead.call(this, statusCode, ...args);
      };

      return nextMiddleware(req, res, next);
    };
  },
};

module.exports = config;
