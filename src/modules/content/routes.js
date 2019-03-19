const controller = require('./controller');

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
          pageTitle: 'Accessibility'
        },
        config: {
          view: 'water/content/accessibility'
        }
      }
    },
    handler: controller.staticPage
  },

  cookies: {
    method: 'GET',
    path: '/cookies',
    config: {
      description: 'Displays cookie information',
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      plugins: {
        viewContext: {
          pageTitle: 'Cookies'
        },
        config: {
          view: 'water/content/cookies'
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
          pageTitle: 'Tell us what you think about this service'
        },
        config: {
          view: 'water/content/feedback'
        }
      }
    },
    handler: controller.staticPage
  },

  privacy: {
    method: 'GET',
    path: '/privacy-policy',
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      plugins: {
        viewContext: {
          pageTitle: 'Privacy: how we use your personal information'
        },
        config: {
          view: 'water/content/privacy_policy'
        }
      }
    },
    handler: controller.staticPage
  }
};
