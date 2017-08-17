module.exports = [

  {
    method: 'GET',
    path: '/public/{param*}',
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
    handler: {
      directory: {
        path: 'public/javascripts',
        listing: true

      }
    }
  }



]
