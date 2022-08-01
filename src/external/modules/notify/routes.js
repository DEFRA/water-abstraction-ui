const Joi = require('joi')
const controller = require('./controller')

module.exports = {
  notifyCallback: {
    method: 'POST',
    path: '/notify/callback',
    handler: controller.callback,
    config: {
      auth: false,
      description: 'Accept callback from Notify',
      validate: {
        headers: Joi.object().keys({
          authorization: Joi.string().required().example('Bearer {{JWT_TOKEN}}')
        }).unknown(true),
        payload: Joi.object().keys({
          id: Joi.string().required().guid(),
          reference: Joi.any(),
          to: Joi.string(),
          status: Joi.string().valid('delivered', 'permanent-failure', 'temporary-failure', 'technical-failure'),
          created_at: Joi.date().iso(),
          completed_at: Joi.date().iso(),
          sent_at: Joi.date().iso(),
          notification_type: Joi.string().valid('sms', 'email'),
          template_id: Joi.string().guid(),
          template_version: Joi.number()
        })
      }
    }
  }
}
