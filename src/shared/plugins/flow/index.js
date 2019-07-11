const qs = require('querystring');

/**
 * Flow plugin creates handlers for GET/POST which:
 *
 * For GET:
 * - Loads model data using the specified adapter
 * - Attaches a form to the request using the specified form factory
 * - Populates request.view.form
 * - Populates request.view.model
 *
 * For POST:
 * - Loads model data using the specified adapter
 * - Attaches a form to the request using the specified form factory
 * - Performs the form.handleRequest method
 * - After the request has completed, persists data if form was valid
 */
const { handleRequest } = require('shared/lib/forms');

const isFormRoute = request => 'flow' in request.route.settings.plugins;

const onPreHandler = async (request, h) => {
  if (!isFormRoute(request)) {
    return h.continue;
  }

  const { flow: options } = request.route.settings.plugins;

  if (!options) {
    return h.continue;
  }

  const model = await options.adapter.get(request);
  const data = model.toObject();
  const initialForm = options.form(request, data);

  // Set form action to current path
  initialForm.action = `${request.path}?${qs.stringify(request.query)}`;

  if (request.method === 'get') {
    request.view.form = initialForm;
  }
  if (request.method === 'post') {
    const validationSchema = options.schema ? options.schema(request, data, initialForm) : undefined;
    request.view.form = handleRequest(initialForm, request, validationSchema);
  }

  request.view.data = data;
  request.model = model;

  return h.continue;
};

const onPostHandler = async (request, h) => {
  if (!isFormRoute(request) || request.method !== 'post') {
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
  register: (server, options) => {
    server.ext({ type: 'onPreHandler', method: onPreHandler });
    server.ext({ type: 'onPostHandler', method: onPostHandler });
  },
  pkg: {
    name: 'flow',
    version: '1.0.0'
  }
};
