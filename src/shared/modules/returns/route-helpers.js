const Joi = require('joi');
const { VALID_RETURN_ID } = require('shared/lib/validators');

const createRoute = (method, path, handler, options) => {
  Joi.assert(options, {
    description: Joi.string(),
    pageTitle: Joi.string().required(),
    showMeta: Joi.boolean(),
    form: Joi.func().required(),
    schema: Joi.func(),
    submit: Joi.boolean()
  });

  return {
    method,
    path: path,
    handler: handler,
    options: {
      description: options.pageTitle,
      validate: {
        query: {
          returnId: VALID_RETURN_ID
        }
      },
      plugins: {
        viewContext: {
          pageTitle: options.pageTitle,
          activeNavLink: 'returns',
          showMeta: options.showMeta || false
        },
        returns: {
          load: true
        },
        flow: {
          form: options.form,
          schema: options.schema,
          submit: options.submit
        }
      }
    }
  };
};

/**
 * Adds return ID query string from request.query.returnId to supplied path
 * @param {Object} request
 * @param {String} path
 */
const addQuery = (request, path) => {
  return `${path}?returnId=${request.query.returnId}`;
};

exports.createRoute = createRoute;
exports.addQuery = addQuery;
