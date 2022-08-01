const Joi = require('joi')
const { scope } = require('../../lib/constants')
const controller = require('./controller')
const config = require('../../config')

const allowedScopes = [scope.chargeVersionWorkflowReviewer]

if (config.featureToggles.allowChargeVersionUploads) {
  module.exports = {
    getUploadChargeInformation: {
      method: 'GET',
      path: '/charge-information/upload/{eventId?}',
      handler: controller.getUploadChargeInformation,
      config: {
        auth: {
          scope: allowedScopes
        },
        validate: {
          params: Joi.object().keys({
            eventId: Joi.string().guid().optional()
          }),
          query: Joi.object().keys({
            error: Joi.string().optional()
          })
        },
        description: 'Upload charge information',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        }
      }
    },

    postUploadChargeInformation: {
      method: 'POST',
      path: '/charge-information/upload',
      handler: controller.postUploadChargeInformation,
      config: {
        auth: {
          scope: allowedScopes
        },
        description: 'Upload charge information',
        payload: {
          output: 'stream',
          allow: 'multipart/form-data',
          maxBytes: 5e+7,
          multipart: true
        }
      }
    },

    getUploadChargeInformationErrorFile: {
      method: 'GET',
      path: '/charge-information/upload/{eventId}/{filename}',
      handler: controller.getUploadChargeInformationErrorFile,
      config: {
        auth: {
          scope: allowedScopes
        },
        validate: {
          params: Joi.object().keys({
            eventId: Joi.string().guid().optional(),
            filename: Joi.string().optional()
          })
        },
        description: 'Upload charge information error file'
      }
    },

    getSpinnerPage: {
      method: 'GET',
      path: '/charge-information/processing-upload/{status}/{eventId}',
      handler: controller.getSpinnerPage,
      config: {
        auth: {
          scope: allowedScopes
        },
        validate: {
          params: Joi.object().keys({
            status: Joi.string().valid('processing', 'submitting'),
            eventId: Joi.string().guid()
          })
        },
        description: 'Uploading charge information data',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        }
      }
    }
  }
}
