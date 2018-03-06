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
        listing: true

      }
    }
  },

  {
    method: 'GET',
    path: '/images/{param*}',
    config: { auth: false ,
      cache: {
          expiresIn: 30 * 1000
      }},
    handler: {
      directory: {
        path: 'public/images',
        listing: true

      }
    }
  },

  {
    method: 'GET',
    path: '/stylesheets/{param*}',
    config: { auth: false ,
      cache: {
          expiresIn: 30 * 1000
      }},
    handler: {
      directory: {
        path: 'public/stylesheets',
        listing: true

      }
    }
  },

  {
    method: 'GET',
    path: '/javascripts/{param*}',
    config: { auth: false ,
      cache: {
          expiresIn: 30 * 1000
      }},
    handler: {
      directory: {
        path: 'public/javascripts',
        listing: true

      }
    }
  }

];
