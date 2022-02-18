const Joi = require('joi');
const controller = require('./controller');

module.exports = {
  getNote: {
    method: 'GET',
    path: '/note/{noteId}',
    handler: controller.getNote,
    options: {
      description: 'Gets details about a particular note',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          noteId: Joi.string().guid().required()
        })
      }
    }
  },
  postNote: {
    method: 'POST',
    path: '/note/{noteId}',
    handler: controller.postNote,
    options: {
      description: 'Posts details about a particular note',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      },
      validate: {
        params: Joi.object().keys({
          noteId: Joi.string().guid().required()
        })
      }
    }
  }
};
