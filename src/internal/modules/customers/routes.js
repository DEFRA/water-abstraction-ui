const controllers = require('./controllers');
const Joi = require('joi');

module.exports = {
  getCustomer: {
    method: 'GET',
    path: '/customer/{companyId}',
    handler: controllers.getCustomer,
    config: {
      description: 'Gets summary details about a particular customer/company',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required()
        })
      }
    }
  }
};
