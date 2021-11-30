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
  getUpdateCustomerContactName: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/{contactId}/name',
    handler: controllers.getUpdateCustomerContactName,
    config: {
      description: 'Gets the page for editing a contact\'s name',
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
  postUpdateCustomerContactName: {
    method: 'POST',
    path: '/customer/{companyId}/contacts/{contactId}/name',
    handler: controllers.postUpdateCustomerContactName,
    config: {
      description: 'POSTs the page for editing a contact\'s name'
    }
  },
  getUpdateCustomerContactDepartment: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/{contactId}/department',
    handler: controllers.getUpdateCustomerContactDepartment,
    config: {
      description: 'Gets the page for editing a contact\'s department',
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
  postUpdateCustomerContactDepartment: {
    method: 'POST',
    path: '/customer/{companyId}/contacts/{contactId}/department',
    handler: controllers.postUpdateCustomerContactDepartment,
    config: {
      description: 'POSTs the page for editing a contact\'s department'
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
  },
  getRemoveCompanyContact: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/remove',
    handler: controllers.getSelectRemoveCompanyContact,
    config: {
      description: 'Entry point for selecting a company contact to remove',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required()
        })
      }
    }
  },
  postRemoveCompanyContact: {
    method: 'POST',
    path: '/customer/{companyId}/contacts/remove',
    handler: controllers.postSelectRemoveCompanyContact,
    config: {
      description: 'POSTs the page for selecting a company contact to remove'
    }
  },
  getCheckRemoveCompanyContact: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/remove/check',
    handler: controllers.getCheckRemoveCompanyContact,
    config: {
      description: 'Entry point for checking a company contact should be removed'
    }
  },
  postCheckRemoveCompanyContact: {
    method: 'POST',
    path: '/customer/{companyId}/contacts/remove/check',
    handler: controllers.postCheckRemoveCompanyContact,
    config: {
      description: 'POSTs the page for removing a company contact'
    }
  },
  getConfirmationRemoveCompanyContact: {
    method: 'GET',
    path: '/customer/{companyId}/contacts/remove/confirmation',
    handler: controllers.getConfirmationRemoveCompanyContact,
    config: {
      description: 'Entry point for checking a company contact should be removed'
    }
  }
};
