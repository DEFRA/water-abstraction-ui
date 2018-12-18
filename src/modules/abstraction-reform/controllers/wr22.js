const { omit } = require('lodash');

const { handleRequest, getValues } = require('../../../lib/forms');

const { getSchemaCategories } = require('../lib/schema-helpers.js');
const { selectSchemaForm } = require('../forms/select-schema');
const { load } = require('../lib/loader');

const { diff } = require('../lib/diff');

const {
  findDataItem, getEditFormAndSchema, getAddFormAndSchema,
  addActionFactory, editActionFactory, persistActions
} = require('../lib/wr22-helpers');

const { wr22 } = require('../lib/schema');

/**
 * A screen to select a custom data point schema (WR22) to add to existing licence
 * @param  {Object} request - HAPI request interface
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object} h       HAPI reply interface
 * @return {Promise}
 */
const getSelectSchema = (request, h) => {
  const { documentId } = request.params;
  const form = request.form || selectSchemaForm(request, wr22);

  const categories = getSchemaCategories(wr22);

  const view = {
    categories,
    ...request.view,
    form,
    back: `/admin/abstraction-reform/licence/${documentId}`
  };

  return h.view('nunjucks/abstraction-reform/add-data.njk', view, { layout: false });
};

/**
 * Post handler for adding new WR22 schema to licence data
 * @param  {Object} request - HAPI request interface
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object} h       HAPI reply interface
 * @return {Promise}
 */
const postSelectSchema = (request, h) => {
  const form = handleRequest(selectSchemaForm(request, wr22), request);

  // If validation errors in form, redisplay with error message
  if (!form.isValid) {
    request.form = form;
    return getAddData(request, h);
  }

  // Otherwise redirect to data capture form
  const { documentId } = request.params;
  const { schema } = getValues(form);

  const path = `/admin/abstraction-reform/licence/${documentId}/add-data/${schema}`;

  return h.redirect(path);
};

/**
 * Render form to enter data for WR22 condition
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with page content
 */
const getAddData = async (request, h) => {
  const { documentId } = request.params;

  const { form, schema } = await getAddFormAndSchema(request);

  const view = {
    ...request.view,
    form: request.form || form,
    schema,
    back: `/admin/abstraction-reform/licence/${documentId}/add-data`
  };
  return h.view('nunjucks/abstraction-reform/edit-data.njk', view, { layout: false });
};

/**
 * POST handler for form to enter data for WR22 condition
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with page content
 */
const postAddData = async (request, h) => {
  const { form, schema } = await getAddFormAndSchema(request);

  const f = handleRequest(form, request, schema);

  if (f.isValid) {
    const { documentId } = request.params;

    // Create data point in licence
    const { licence, arLicence } = await load(documentId);

    const add = addActionFactory(request, licence);
    const { id } = add.payload;
    const edit = editActionFactory(request, getValues(f), id);
    const actions = [add, edit];

    await persistActions(licence, arLicence, actions);

    return h.redirect(`/admin/abstraction-reform/licence/${documentId}#${id}`);
  } else {
    request.form = f;
    return getAddData(request, h);
  }
};

/**
 * Edit existing data item
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI reply
 * @return {Promise}         resolves with rendered form
 */
const getEditData = async (request, h) => {
  const { schema, form } = await getEditFormAndSchema(request);

  const view = {
    ...request.view,
    form: request.form || form,
    schema
  };

  return h.view('nunjucks/abstraction-reform/edit-data.njk', view, { layout: false });
};

/**
 * Post handler to edit a WR22 condition
 * A diff is performed so that only modified fields are stored as part of the edit
 * @param  {Object}  request - HAPI request
 * @param  {Object}  h       - HAPI response
 * @return {Promise}         resolves with redirect on success,
 *                           or displays form again with errors
 */
const postEditData = async (request, h) => {
  const { id, documentId } = request.params;

  const { schema, form, licence, arLicence, finalState } = await getEditFormAndSchema(request);

  const updated = handleRequest(form, request, schema);

  if (updated.isValid) {
    // Get existing data item
    const item = findDataItem(finalState, id);

    // Get submitted form data and diff with current data
    const formValues = omit(getValues(updated), ['csrf_token']);
    const data = diff(item.content, formValues);

    // Persist if there are changes
    if (data) {
      const edit = editActionFactory(request, data, id);
      await persistActions(licence, arLicence, [edit]);
    }

    return h.redirect(`/admin/abstraction-reform/licence/${documentId}#${id}`);
  } else {
    request.form = updated;
    return getEditData(request, h);
  }
};

module.exports = {
  getSelectSchema,
  postSelectSchema,
  getAddData,
  postAddData,
  getEditData,
  postEditData
};
