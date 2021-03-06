(function() {
  module.exports = function(server) {
    var analytics, api, config, db, defaults, redis, settings, web;
    settings = require("./config");
    config = settings.config;
    defaults = settings.defaults;
    db = require('puffer').instances[config.databases.application.name];
    analytics = require('puffer').instances[config.databases.analytics.name];
    redis = require("redis").createClient(config.cache.port, config.cache.host);
    api = server.select('api');
    web = server.select('web');
    redis.get(config.app + ".cacheserver", function(err, res) {
      if (err) {
        return console.warn('Cache server is not working ...');
      } else {
        return console.info("Cache server is at " + config.cache.host + ":" + config.cache.port);
      }
    });
    server.register([
      {
        register: require('hapi-auth-cookie')
      }, {
        register: require('vision')
      }, {
        register: require('inert')
      }, {
        register: require('lout')
      }, {
        register: require("good"),
        options: {
          reporters: [
            {
              reporter: require('good-console'),
              events: {
                log: '*',
                response: '*'
              }
            }
          ]
        }
      }
    ], function(err) {
      if (err) {
        throw err;
      }
      return server.auth.strategy('session', 'cookie', {
        password: 'secret',
        isSecure: false
      });
    });
    server.register([
      {
        register: require('hapi-io'),
        options: {
          auth: {
            mode: 'try',
            strategy: 'session'
          },
          connectionLabel: 'api'
        }
      }
    ], function(err) {
      if (err) {
        throw err;
      }
    });
    server.select(['web', 'api']).register([
      {
        register: require('otolist.cars'),
        options: {
          database: db,
          mobile: defaults.mobile,
          cars: defaults.cars,
          colors: defaults.colors
        }
      }
    ], function(err) {
      if (err) {
        throw err;
      }
    });
    return server.start(function() {
      console.info('API server started at ' + server.select('api').info.uri);
      return console.info('Web server started at ' + server.select('web').info.uri);
    });
  };

}).call(this);
