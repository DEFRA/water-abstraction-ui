const controller = require('./controller')
const { baseUrl } = require('../../config')

module.exports = {

  accessibility: {
    method: 'GET',
    path: '/accessibility',
    config: {
      description: 'Displays accessibility information',
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      plugins: {
        viewContext: {
          pageTitle: 'Accessibility statement for Manage your water abstraction or impoundment licence online',
          back: '/licences',
          baseUrl
        },
        config: {
          view: 'nunjucks/content/accessibility'
        }
      }
    },
    handler: controller.staticPage
  },

  feedback: {
    method: 'GET',
    path: '/feedback',
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      plugins: {
        viewContext: {
          pageTitle: 'Tell us what you think about this service',
          back: '/licences'
        },
        config: {
          view: 'nunjucks/content/feedback'
        }
      }
    },
    handler: controller.staticPage
  },

  privacyNext: {
    method: 'GET',
    path: '/privacy-policy',
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      plugins: {
        viewContext: {
          pageTitle: 'Privacy notice',
          back: '/licences'
        },
        config: {
          view: 'nunjucks/content/privacy-policy'
        }
      }
    },
    handler: controller.staticPage
  },

  researchPrivacy: {
    method: 'GET',
    path: '/research-privacy-policy',
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      plugins: {
        viewContext: {
          pageTitle: 'Privacy notice for water resources user research',
          back: '/licences'
        },
        config: {
          view: 'nunjucks/content/research-privacy-policy'
        }
      }
    },
    handler: controller.staticPage
  }
}
