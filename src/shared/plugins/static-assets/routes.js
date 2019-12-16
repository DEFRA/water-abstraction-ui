module.exports = {
  staticAssets: {
    method: 'GET',
    path: '/public/{tail*}',
    config: {
      auth: false,
      cache: {
        expiresIn: 30 * 1000
      }
    },
    handler: {
      file: {
        path: function (request) {
          if (request.params.tail.startsWith('stylesheets')) {
            // stylesheet URLs contain the package.json version so that
            // the cache can be totally busted between releases/
            // index 0: 'stylesheets'
            // index 1: the package version number
            const afterVersion = request.params.tail.split('/').slice(2);
            return `public/stylesheets/${afterVersion.join('/')}`;
          }
          return `public/${request.params.tail}`;
        }
      }
    }
  },

  govUkFrontendAssets: {
    method: 'GET',
    path: '/assets/{param*}',
    config: {
      description: 'Serve static assets for GOV.UK frontend',
      auth: false,
      cache: {
        expiresIn: 30 * 1000
      }
    },
    handler: {
      directory: {
        path: 'node_modules/govuk-frontend/govuk/assets/',
        listing: false
      }
    }
  },

  govUkFrontendJS: {
    method: 'GET',
    path: '/assets/js/all.js',
    config: {
      description: 'Serve static assets for GOV.UK frontend',
      auth: false,
      cache: {
        expiresIn: 30 * 1000
      }
    },
    handler: {
      file: 'node_modules/govuk-frontend/govuk/all.js'
    }
  }
};
