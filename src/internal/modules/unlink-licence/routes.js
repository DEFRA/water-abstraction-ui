const Joi = require('@hapi/joi');
const controller = require('./controller');

module.exports = {
  getUnlinkLicence: {
    path: '/licences/{documentId}/unlink-licence',
    method: 'GET',
    handler: controller.getUnlinkLicence,
    config: {
      description: 'Confirm you want to unlink licence',
      auth: { scope: 'unlink_licences' },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        },
        licenceData: {
          load: {
            company: true
          }
        }
      },
      validate: {
        params: {
          documentId: Joi.string().guid()
        },
        query: {
          userId: Joi.number().integer().required()
        }
      }
    }
  },
  postUnlinkLicence: {
    path: '/licences/{documentId}/unlink-licence',
    method: 'POST',
    handler: controller.postUnlinkLicence,
    config: {
      description: 'Confirm you want to unlink licence',
      auth: { scope: 'unlink_licences' },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        },
        licenceData: {
          load: {
            company: true
          }
        }
      },
      validate: {
        params: {
          documentId: Joi.string().guid()
        },
        query: {
          userId: Joi.number().integer().required()
        }
      }
    }
  },
  getUnlinkLicenceSuccess: {
    path: '/licences/{documentId}/unlink-licence/success',
    method: 'GET',
    handler: controller.getUnlinkLicenceSuccess,
    config: {
      description: 'Unlink licence successful',
      auth: { scope: 'unlink_licences' },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        },
        licenceData: {
          load: {
            licence: true
          }
        }
      },
      validate: {
        params: {
          documentId: Joi.string().guid()
        },
        query: {
          userId: Joi.number().integer().required(),
          companyName: Joi.string().required()
        }
      }
    }
  }
};
