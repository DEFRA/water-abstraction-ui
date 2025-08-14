'use strict'

const { get } = require('lodash')

const testMode = parseInt(process.env.TEST_MODE) === 1

const environment = process.env.ENVIRONMENT
const isLocal = environment === 'local'
const isProduction = environment === 'prd'

const isTlsConnection = (process.env.REDIS_HOST || '').includes('aws')
const isRedisLazy = !!process.env.LAZY_REDIS

const crmUri = process.env.CRM_URI || 'http://127.0.0.1:8002/crm/1.0'

const srocStartDate = new Date('2022-04-01')
const isSrocLive = new Date() >= srocStartDate || !isProduction

const { internal } = require('./lib/constants').scope

module.exports = {

  baseUrl: process.env.ADMIN_BASE_URL,

  blankie: {
    frameSrc: ['self', 'www.smartsurvey.co.uk'],
    scriptSrc: ['self', '*.google-analytics.com'],
    fontSrc: ['self', 'assets.publishing.service.gov.uk', 'data:'],
    imgSrc: ['self', '*.google-analytics.com'],
    connectSrc: '*.google-analytics.com',
    reportOnly: true,
    reportUri: '/csp/report'
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

  googleAnalytics: {
    propertyId: process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
    debug: isLocal
  },

  hapiAuthCookie: {
    cookie: 'sid',
    password: process.env.COOKIE_SECRET,
    isSecure: !isLocal,
    isSameSite: 'Lax',
    ttl: 2 * 60 * 60 * 1000, // Set session to 2 hours,
    redirectTo: '/signin',
    isHttpOnly: true,
    keepAlive: true // ttl restarts after each request
  },

  idm: {
    application: 'water_admin'
  },

  jwt: {
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: ['HS256'] },
    token: process.env.JWT_TOKEN
  },

  // This config is specifically for hapi-pino which was added to replace the deprecated (and noisy!) hapi/good. At
  // some point all logging would go through this. But for now, it just covers requests & responses
  log: {
    // Credit to https://stackoverflow.com/a/323546/6117745 for how to handle
    // converting the env var to a boolean
    logAssetRequests: (String(process.env.LOG_ASSET_REQUESTS) === 'true') || false,
    logInTest: (String(process.env.LOG_IN_TEST) === 'true') || false,
    level: process.env.WRLS_LOG_LEVEL || 'warn'
  },

  // This config is used by water-abstraction-helpers and its use of Winston and Airbrake. Any use of `logger.info()`,
  // for example, is built on this config.
  logger: {
    level: process.env.WRLS_LOG_LEVEL || 'warn',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  sanitize: {
    pruneMethod: 'replace',
    replaceValue: ''
  },

  server: {
    port: 8008,
    router: {
      stripTrailingSlash: true
    }
  },

  services: {
    water: process.env.WATER_URI || 'http://127.0.0.1:8001/water/1.0',
    crm: crmUri,
    crm_v2: crmUri.replace('1.0', '2.0'),
    idm: process.env.IDM_URI || 'http://127.0.0.1:8003/idm/1.0',
    permits: process.env.PERMIT_URI || 'http://127.0.0.1:8004/API/1.0/',
    returns: process.env.RETURNS_URI || 'http://127.0.0.1:8006/returns/1.0',
    system: process.env.SYSTEM_URI || 'http://127.0.0.1:8013'
  },

  testMode,
  environment,
  isLocal,
  isProduction,

  // Configured to last 5 days but will be reset on sign in and
  // sign out meaning that the session lasts for as long as the user's
  // authenticated session.
  yar: {
    maxCookieSize: 0,
    cache: {
      expiresIn: 6 * 60 * 60 * 1000
    },
    cookieOptions: {
      password: process.env.COOKIE_SECRET,
      isSecure: !isLocal,
      isSameSite: 'Lax',
      isHttpOnly: true,
      ttl: 5 * 24 * 60 * 60 * 1000
    },
    storeBlank: false

  },

  viewLicence: {
    allowedScopes: [internal]
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    ...(isTlsConnection) && { tls: {} },
    db: process.env.NODE_ENV === 'test' ? 6 : 1,
    lazyConnect: isRedisLazy
  },
  isSrocLive,
  srocStartDate,
  featureToggles: {
    srocChargeInformation: isSrocLive,
    manageAgreements: true,
    chargeInformation: true,
    manageInvoiceAccounts: true,
    deleteAllBillingData: process.env.ENABLE_DELETE_ALL_BILLING_DATA_FEATURE === 'true' && !isProduction,
    waterAbstractionAlerts: true,
    recalculateBills: true,
    allowChargeVersionUploads: (get(process.env, 'ALLOW_CHARGE_VERSION_UPLOADS') || '').toLowerCase() === 'true',
    triggerSrocTwoPartTariff: (get(process.env, 'TRIGGER_SROC_TWO_PART_TARIFF') || '').toLowerCase() === 'true',
    acceptanceTestsProxy: !isProduction,
    showVerificationCode: process.env.SHOW_VERIFICATION_CODE_FEATURE === 'true' && !isProduction,
    showReturnRequirements: (get(process.env, 'SHOW_RETURN_REQUIREMENTS') || '').toLowerCase() === 'true' && !isProduction,
    triggerSrocAnnual: (get(process.env, 'TRIGGER_SROC_ANNUAL') || '').toLowerCase() === 'true',
    useNewBillRunSetup: (get(process.env, 'USE_NEW_BILL_RUN_SETUP') || '').toLowerCase() === 'true',
    useWorkflowSetupLinks: (get(process.env, 'USE_WORKFLOW_SETUP_LINKS') || 'true').toLowerCase() === 'true',
    enableAdHocNotifications: process.env.ENABLE_AD_HOC_NOTIFICATIONS === 'true',
    enableBillingAccountView: process.env.ENABLE_BILLING_ACCOUNT_VIEW === 'true',
    enableSystemLicenceView: process.env.ENABLE_SYSTEM_LICENCE_VIEW === 'true',
    enableSystemNotices: process.env.ENABLE_SYSTEM_NOTICES_VIEW === 'true',
    enableSystemNotifications: process.env.ENABLE_SYSTEM_NOTIFICATIONS === 'true',
    enableSystemReturnsView: process.env.ENABLE_SYSTEM_RETURNS_VIEW === 'true',
    enableMonitoringStationsView: process.env.ENABLE_MONITORING_STATIONS_VIEW === 'true',
    useNewProfilePage: process.env.USE_NEW_PROFILE_PAGE === 'true'
  },
  billRunsToDisplayPerPage: process.env.BILL_RUNS_TO_DISPLAY_PER_PAGE || 20
}
