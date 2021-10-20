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
  },
  getContactPurpose: {
    method: 'GET',
    path: '/customer/{companyId}/customercontact/{contactId}',
    handler: controllers.getContactPurpose,
    config: {
      description: 'Gets contact details and email purpose (e.g. water abstraction alerts)',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required(),
          contactId: Joi.string().guid().required()
        })
      }
    }
  }
};
