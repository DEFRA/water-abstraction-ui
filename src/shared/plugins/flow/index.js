const qs = require('querystring');
const { get, set } = require('lodash');

/**
 * Flow plugin creates handlers for GET/POST which:
 *
 * For GET/POST:
 * - Loads model data using the specified adapter
 * - Attaches a form to the request using the specified form factory
 * - Sets form action attribute to current path
 * - Populates request.view.form with form object
 * - Pooulates request.view.data with model.toObject()
 * - Populates request.model
 *
 * Additionally for POST:
 * - Handles request using form schema or default schema
 * - If form is valid updates session or submits final data
 */
const { handleRequest } = require('shared/lib/forms');

const isFormRoute = request => !!get(request, 'route.settings.plugins.flow', false);

const isFormPostRoute = request => isFormRoute(request) && request.method === 'post';

const getPathAndQueryString = request => {
  const { path, query } = request;
  const querystring = qs.stringify(query || {});
  return querystring ? `${path}?${querystring}` : path;
};

const onPreHandler = async (request, h) => {
  if (!isFormRoute(request)) {
    return h.continue;
  }

  const { flow: options } = request.route.settings.plugins;

  const model = await options.adapter.get(request);
  const data = model.toObject();
  const initialForm = options.form(request, data);

  // Set form action to current path
  initialForm.action = getPathAndQueryString(request);

  if (request.method === 'get') {
    set(request, 'view.form', initialForm);
  }
  if (request.method === 'post') {
    const validationSchema = options.schema ? options.schema(request, data, initialForm) : undefined;
    set(request, 'view.form', handleRequest(initialForm, request, validationSchema));
  }

  request.view.data = data;
  request.model = model;

  return h.continue;
};

const onPostHandler = async (request, h) => {
  if (!isFormPostRoute(request)) {
    return h.continue;
  }

  if (request.view.form.isValid) {
    const { flow: options } = request.route.settings.plugins;

    // Data submission
    if (options.submit) {
      await options.adapter.submit(request, request.model);
    } else {
      // Store to session
      await options.adapter.set(request, request.model);
    }
  }

  return h.continue;
};

module.exports = {
  register: (server) => {
    server.ext({ type: 'onPreHandler', method: onPreHandler });
    server.ext({ type: 'onPostHandler', method: onPostHandler });
  },
  pkg: {
    name: 'flow',
    version: '1.0.0'
  }
};

module.exports._onPreHandler = onPreHandler;
module.exports._onPostHandler = onPostHandler;
