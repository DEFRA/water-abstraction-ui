const Joi = require('joi');
const apiController = require('./api-controller');

const routes = {};

if (parseInt(process.env.TEST_MODE) === 1) {
  routes.findEmailByAddress = {
    method: 'GET',
    path: '/notifications/last',
    handler: apiController.findLastEmail,
    config: {
      plugins: {
        errorPlugin: {
          ignore: true
        }
      },
      auth: false,
      validate: {
        query: Joi.object().keys({
          email: Joi.string().required()
        })
      }
    }
  };
}

module.exports = routes;
