const Joi = require('joi');
const controller = require('./controller');

module.exports = {
  getStart: {
    method: 'GET',
    path: '/start',
    handler: controller.getRegisterStart,
    config: {
      auth: false,
      description: 'Register start page - information for users before registering'
    }
  },
  getRegister: {
    method: 'GET',
    path: '/register',
    handler: controller.getEmailAddress,
    config: {
      auth: false,
      description: 'Register user account - get email address'
    }
  },
  postRegister: {
    method: 'POST',
    path: '/register',
    handler: controller.postEmailAddress,
    config: {
      auth: false,
      description: 'Register user account - email address form handler',
      validate: {
        payload: {
          email: Joi.string().allow('').max(254)
        }
      }
    }
  },
  getSuccess: {
    method: 'GET',
    path: '/success',
    handler: controller.getRegisterSuccess,
    config: {
      auth: false,
      description: 'Register user account - success page'
    }
  },
  getSendAgain: {
    method: 'GET',
    path: '/send-again',
    handler: controller.getSendAgain,
    config: {
      auth: false,
      description: 'Register user account - resend email form'
    }
  },
  postSendAgain: {
    method: 'POST',
    path: '/send-again',
    handler: controller.postSendAgain,
    config: {
      auth: false,
      description: 'Register user account - resend email address form handler',
      validate: {
        payload: {
          email: Joi.string().allow('').max(254)
        }
      }
    }
  },
  getResentSuccess: {
    method: 'GET',
    path: '/resent-success',
    handler: controller.getResentSuccess,
    config: {
      auth: false,
      description: 'Register user account - email resent success page'
    }
  }
};
