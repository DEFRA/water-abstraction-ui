'use strict'

const config = require('../../../internal/config')

const systemUrl = new URL(config.services.system)
const proxyDefaults = {
  timeout: 15000, // 15 seconds - default is 3 minutes
  // Forwards the headers from the client to the upstream service. This is needed for system to receive things like the
  // `accept:` header, which indicates what MIME type is requested.
  passThrough: true,
  // Sets the 'X-Forwarded-For', 'X-Forwarded-Port', 'X-Forwarded-Proto', 'X-Forwarded-Host' headers. 'X-Forwarded-For',
  // for example, is the standard header for identifying the originating IP address of a client connecting to a web
  // server through a proxy server. As such, it is often used in security and authentication checks.
  xforward: true,
  // When false (the default) any locally defined state is removed from incoming requests before being sent to the
  // upstream service. In practice we saw any other cookies set in our browser were being passed to system but not the
  // ones set by this app; sid and session. This app still handles login and initialises the sid cookie. System needs
  // to be able to see it to also confirm the user is authenticated and authorised to access whatever page they've been
  // directed to. Hence, we set this to true.
  localStatePassThrough: true
}

const routes = [
  {
    method: 'GET',
    // This will match all path segments after /system. Note in our proxy URI we refer to this only as {tail}. The path
    // param hapi provides will contain all the segments, for example, request.params.tail === '/test/supplementary'.
    // We need to refer to it in the same way we access it on the request object.
    path: '/system/{tail*}',
    handler: {
      proxy: {
        uri: `${systemUrl.protocol}//${systemUrl.hostname}:${systemUrl.port}/{tail}{query}`,
        ...proxyDefaults
      }
    },
    config: {
      auth: false,
      description: 'Proxies requests to the Water Abstraction System'
    }
  },
  {
    method: 'GET',
    path: '/assets/all.js',
    handler: {
      proxy: {
        uri: `${systemUrl.protocol}//${systemUrl.hostname}:${systemUrl.port}/assets/all.js`,
        ...proxyDefaults
      }
    },
    config: {
      auth: false,
      description: 'Proxies JS asset requests to the Water Abstraction System'
    }
  },
  {
    method: 'GET',
    path: '/assets/stylesheets/application.css',
    handler: {
      proxy: {
        uri: `${systemUrl.protocol}//${systemUrl.hostname}:${systemUrl.port}/assets/stylesheets/application.css`,
        ...proxyDefaults
      }
    },
    config: {
      auth: false,
      description: 'Proxies CSS asset requests to the Water Abstraction System'
    }
  },
  {
    method: 'GET',
    path: '/assets/images/{path*}',
    handler: {
      proxy: {
        uri: `${systemUrl.protocol}//${systemUrl.hostname}:${systemUrl.port}/assets/{path*}`,
        ...proxyDefaults
      }
    },
    config: {
      auth: false,
      description: 'Proxies CSS asset requests to the Water Abstraction System'
    }
  },
  {
    method: 'POST',
    // This will match all path segments after /system. Note in our proxy URI we refer to this only as {tail}. The path
    // param hapi provides will contain all the segments, for example, request.params.tail === '/test/supplementary'.
    // We need to refer to it in the same way we access it on the request object.
    path: '/system/{tail*}',
    handler: {
      proxy: {
        uri: `${systemUrl.protocol}//${systemUrl.hostname}:${systemUrl.port}/{tail}{query}`,
        ...proxyDefaults
      }
    },
    config: {
      auth: false,
      description: 'Proxies requests to the Water Abstraction System'
    }
  }
]

module.exports = routes
