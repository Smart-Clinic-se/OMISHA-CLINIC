module.exports = {
  webpack: function (config, env) {
    return config;
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);

      // Remove deprecated options
      delete config.onBeforeSetupMiddleware;
      delete config.onAfterSetupMiddleware;

      // Add setupMiddlewares
      config.setupMiddlewares = (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        // If you had custom logic in onBeforeSetupMiddleware, put it here:
        // ...

        // If you had custom logic in onAfterSetupMiddleware, put it here:
        // ...

        return middlewares;
      };

      return config;
    };
  },
};
