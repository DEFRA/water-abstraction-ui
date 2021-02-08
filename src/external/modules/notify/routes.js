const Joi = require('@hapi/joi');
const controller = require('./controller');

module.exports = {
  notifyCallback: {
    method: 'POST',
    path: `/notify/callback`,
    handler: controller.callback,
    config: {
      auth: false,
      description: 'Accept callback from Notify',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required().example('Bearer {{JWT_TOKEN}}')
        }).unknown(true),
        payload: {
          id: Joi.string().required().guid(),
          reference: Joi.any(),
          to: Joi.string(),
          status: Joi.string().valid('delivered', 'permanent-failure', 'temporary-failure', 'technical-failure'),
          created_at: Joi.date().iso(),
          completed_at: Joi.date().iso(),
          sent_at: Joi.date().iso(),
          notification_type: Joi.string().valid('sms', 'email')
        }
      }
    }
  }
};
