const Joi = require('joi')
const { v4: uuid } = require('uuid')
const { VALID_RETURN_ID, OPTIONAL_GUID } = require('shared/lib/validators')

const optionsSchema = Joi.object().keys({
  description: Joi.string(),
  pageTitle: Joi.string().required(),
  showMeta: Joi.boolean(),
  form: Joi.function().required(),
  schema: Joi.function(),
  submit: Joi.boolean(),
  pre: Joi.array().optional()
})

const createPluginsOptions = options => ({
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
})

const createRoute = (method, path, handler, options) => {
  Joi.assert(options, optionsSchema)

  return {
    method,
    path,
    handler,
    options: {
      description: options.pageTitle,
      validate: {
        query: Joi.object().keys({
          returnId: VALID_RETURN_ID,
          error: OPTIONAL_GUID
        })
      },
      plugins: createPluginsOptions(options),
      pre: options.pre
    }
  }
}

/**
 * Adds return ID query string from request.query.returnId to supplied path
 * @param {Object} request
 * @param {String} path
 */
const addQuery = (request, path) => {
  return `${path}?returnId=${request.query.returnId}`
}

/**
 * Redirects user back to previous page in error state
 * It stores the current state of the form in the session using a unique
 * key, and then redirects to the supplied step
 * @param {Object} request - hapi request instance
 * @param {Object} h - hapi response toolkit
 * @param {String} step - the step (URL path) to navigate to
 */
const errorRedirect = (request, h, step) => {
  const key = uuid()
  request.yar.set(key, request.view.form)
  return h.redirect(addQuery(request, step) + '&error=' + key)
}

exports.createRoute = createRoute
exports.addQuery = addQuery
exports.errorRedirect = errorRedirect
