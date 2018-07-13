const controller = require('./controller');
const Joi = require('joi');

const getContactInformation = {
  method: 'GET',
  path: '/admin/contact-information',
  handler: controller.getContactInformation,
  options: {
    description: 'Displays the user\'s contact information'
  }
};

const postContactInformation = {
  method: 'POST',
  path: '/admin/contact-information',
  handler: controller.postContactInformation,
  options: {
    description: 'Updates the user\'s contact information if valid',
    validate: {
      payload: {
        csrf_token: Joi.string().guid().required(),
        'contact-name': Joi.string().allow('').max(254),
        'contact-job-title': Joi.string().allow('').max(254),
        'contact-email': Joi.string().allow('').max(254),
        'contact-tel': Joi.string().max(254).allow(''),
        'contact-address': Joi.string().max(254).allow('')
      }
    },
    plugins: {
      formValidator: {
        payload: {
          csrf_token: Joi.string().uuid().required(),
          'contact-name': Joi.string().allow(''),
          'contact-job-title': Joi.string().allow(''),
          'contact-email': Joi.string().email().allow(''),
          'contact-tel': Joi.string().allow(''),
          'contact-address': Joi.string().allow('')
        }
      }
    }
  }
};

module.exports = {
  getContactInformation,
  postContactInformation
};
