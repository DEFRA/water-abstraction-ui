module.exports = [

  {
    method: 'GET',
    path: '/public/{param*}',
    config: {
      auth: false,
      cache: {
        expiresIn: 30 * 1000
      }
    },
    handler: {
      directory: {
        path: 'public/',
        listing: false

      }
    }
  },

  {
    method: 'GET',
    path: '/images/{param*}',
    config: { auth: false,
      cache: {
        expiresIn: 30 * 1000
      } },
    handler: {
      directory: {
        path: 'public/images',
        listing: false

      }
    }
  },

  {
    method: 'GET',
    path: '/stylesheets/{param*}',
    config: { auth: false,
      cache: {
        expiresIn: 30 * 1000
      } },
    handler: {
      directory: {
        path: 'public/stylesheets',
        listing: false

      }
    }
  },

  {
    method: 'GET',
    path: '/javascripts/{param*}',
    config: { auth: false,
      cache: {
        expiresIn: 30 * 1000
      } },
    handler: {
      directory: {
        path: 'public/javascripts',
        listing: false

      }
    }
  }

];
