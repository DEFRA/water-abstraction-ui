const Joi = require('joi');
const controller = require('./controller');

module.exports = {
  getSelectCompany: {
    method: 'GET',
    path: '/select-company',
    handler: controller.getSelectCompany,
    options: {

      description: 'Allows the user to select their company'
    }
  },

  postSelectCompany: {
    method: 'POST',
    path: '/select-company',
    handler: controller.postSelectCompany,
    options: {
      description: 'Allows the user to select their company',
      validate: {
        payload: {
          company: Joi.number(),
          csrf_token: Joi.string().guid().required()
        }
      }
    }
  }
};
