const { handleRequest, getValues } = require('shared/lib/forms');

/**
 * GET handler to render form for user input
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response toolkit
 * @param  {[Object]}  f  - form object, when re-rendering form in error state
 * @return {Promise}
 */
const getHandler = async (request, h, f) => {
  const { store, template, form, getPreviousPath } = request.route.settings.plugins.flow;

  // Load model from session
  const data = await store.get(request);

  // Prepare view data
  const view = {
    ...request.view,
    form: f || form(request, data),
    back: getPreviousPath(request, data),
    data
  };

  return h.view(template, view, { layout: false });
};

/**
 * POST handler for form
 */
const postHandler = async (request, h) => {
  const { store, update, form, getNextPath, schema, isSubmit } =
    request.route.settings.plugins.flow;

  // Load model from session
  const data = await store.get(request);

  // Create form
  const validationSchema = schema ? schema(request, data) : undefined;
  const f = handleRequest(form(request, data), request, validationSchema);

  if (f.isValid) {
    // Persist data to session and redirect
    const newState = update(data, getValues(f));
    await store.set(request, newState);
    // Submit data if specified on this route
    if (isSubmit) {
      await store.submit(request, newState);
    }
    return h.redirect(getNextPath(request, newState));
  }

  // If form is not valid, re-render in error state
  return getHandler(request, h, f);
};

exports.getHandler = getHandler;
exports.postHandler = postHandler;
