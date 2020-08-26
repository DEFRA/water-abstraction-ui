require('dotenv').config();
const testMode = parseInt(process.env.TEST_MODE) === 1;
const isLocal = process.env.NODE_ENV === 'local';
const { withQueryStringSubset } = require('./lib/url');

module.exports = {

  blankie: {
    frameSrc: ['self', 'www.smartsurvey.co.uk'],
    scriptSrc: ['self', '*.google-analytics.com'],
    fontSrc: ['self', 'assets.publishing.service.gov.uk', 'data:'],
    imgSrc: ['self', '*.google-analytics.com'],
    connectSrc: '*.google-analytics.com',
    reportOnly: true,
    reportUri: '/csp/report'
  },

  blipp: {
    showAuth: true
  },

  crm: {
    regimes: {
      water: {
        entityId: '0434dc31-a34e-7158-5775-4694af7a60cf'
      }
    }
  },

  defaultAuth: {
    strategy: 'standard',
    mode: 'try'
  },

  good: {
    ops: {
      interval: 60000
    }
  },

  googleAnalytics: {
    propertyId: process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
    debug: isLocal
  },

  hapiAuthCookie: {
    cookie: 'sid',
    password: process.env.COOKIE_SECRET,
    isSecure: !isLocal,
    isSameSite: 'Lax',
    ttl: 24 * 60 * 60 * 1000, // Set session to 1 day,
    redirectTo: request => withQueryStringSubset('/welcome', request.query, '_ga'),
    isHttpOnly: true,
    keepAlive: true // ttl restarts after each request
  },

  idm: {
    application: 'water_vml'
  },

  isLocal,

  jwt: {
    token: process.env.JWT_TOKEN,
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: [ 'HS256' ] }
  },

  logger: {
    level: testMode ? 'info' : 'error',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  returns: {
    showFutureReturns: testMode
  },

  sanitize: {
    pruneMethod: 'replace',
    replaceValue: ''
  },

  server: {
    port: 8000,
    router: {
      stripTrailingSlash: true
    }
  },

  services: {
    water: process.env.WATER_URI || 'http://127.0.0.1:8001/water/1.0',
    crm: process.env.CRM_URI || 'http://127.0.0.1:8002/crm/1.0',
    idm: process.env.IDM_URI || 'http://127.0.0.1:8003/idm/1.0',
    permits: process.env.PERMIT_URI || 'http://127.0.0.1:8004/API/1.0/',
    returns: process.env.RETURNS_URI || 'http://127.0.0.1:8006/returns/1.0'
  },

  testMode,

  // Configured to effectively last forever but will be reset on sign in and
  // sign out meaning that the session lasts for as long as the user's
  // authenticated session.
  yar: {
    maxCookieSize: 0,
    cache: {
      expiresIn: 10 * 365 * 24 * 60 * 60 * 1000
    },
    cookieOptions: {
      password: process.env.COOKIE_SECRET,
      isSecure: !isLocal,
      isSameSite: 'Lax',
      isHttpOnly: true,
      ttl: 10 * 365 * 24 * 60 * 60 * 1000
    },
    storeBlank: false
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    ...!isLocal && { tls: {} },
    db: 0
  }
};
