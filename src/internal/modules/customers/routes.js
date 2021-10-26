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
        }),
        query: Joi.object().keys({
          newContactKey: Joi.string().optional()
        })
      }
    }
  },
  getCustomerContact: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/{contactId}',
    handler: controllers.getCustomerContact,
    config: {
      description: 'Gets the page for viewing a contact in the company context',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required(),
          contactId: Joi.string().guid().required()
        })
      }
    }
  },
  getAddCustomerContactEmail: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/{contactId}/email',
    handler: controllers.getAddCustomerContactEmail,
    config: {
      description: 'Gets the page for editing a contact\'s email address',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required(),
          contactId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          isNew: Joi.any().optional(),
          form: Joi.string().guid().optional()
        })
      }
    }
  },
  postAddCustomerContactEmail: {
    method: 'POST',
    path: '/customer/{companyId}/contacts/{contactId}/email',
    handler: controllers.postAddCustomerContactEmail,
    config: {
      description: 'POSTs the page for editing a contact\'s email address'
    }
  },
  getUpdateCustomerWaterAbstractionAlertsPreferences: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/{contactId}/water-abstraction-alerts-preferences',
    handler: controllers.getUpdateCustomerWaterAbstractionAlertsPreferences,
    config: {
      description: 'Gets the page for editing a contact\'s WAA preferences',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required(),
          contactId: Joi.string().guid().required()
        })
      }
    }
  },
  postUpdateCustomerWaterAbstractionAlertsPreferences: {
    method: 'POST',
    path: '/customer/{companyId}/contacts/{contactId}/water-abstraction-alerts-preferences',
    handler: controllers.postUpdateCustomerWaterAbstractionAlertsPreferences,
    config: {
      description: 'POSTs the page for editing a contact\'s WAA preferences'
    }
  },
  getCreateCompanyContact: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/new',
    handler: controllers.getCreateCompanyContact,
    config: {
      description: 'Entry point for creating a new company contact',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required()
        })
      }
    }
  }
};
