const { pick, find } = require('lodash');
const shallowDiff = require('shallow-diff');

const { handleRequest, getValues } = require('../../../lib/forms');
const { load, update } = require('../lib/loader');
const { extractData, transformNulls, prepareData } = require('../lib/helpers');
const { getPermissions } = require('../lib/permissions');
const { getPurpose, getLicence, getPoint, getCondition, getVersion, getParty, getAddress } = require('../lib/licence-helpers');
const { createEditPurpose, createEditLicence, createEditPoint, createEditCondition, createSetStatus, createEditVersion, createEditParty, createEditAddress } = require('../lib/action-creators');
const { stateManager, getInitialState } = require('../lib/state-manager');
const { search, recent } = require('../lib/search');
const { STATUS_IN_PROGRESS, STATUS_IN_REVIEW } = require('../lib/statuses');

const { setStatusForm, setStatusSchema } = require('../forms/set-status');
const { selectSchemaForm } = require('../forms/select-schema');

const { getSchemaCategories } = require('../lib/schema-helpers.js');
const { dereference, schemaToForm } = require('../lib/form-generator.js');

const customSchema = [
  require('../schema/wr22/2.1.json')
];

// Config for editing different data models
const objectConfig = {
  licence: {
    schema: require('../schema/licence.json'),
    getter: getLicence,
    actionCreator: createEditLicence
  },
  purpose: {
    schema: require('../schema/purpose.json'),
    getter: getPurpose,
    actionCreator: createEditPurpose
  },
  point: {
    schema: require('../schema/point.json'),
    getter: getPoint,
    actionCreator: createEditPoint
  },
  condition: {
    schema: require('../schema/condition.json'),
    getter: getCondition,
    actionCreator: createEditCondition
  },
  version: {
    schema: require('../schema/version.json'),
    getter: getVersion,
    actionCreator: createEditVersion
  },
  party: {
    schema: require('../schema/party.json'),
    getter: getParty,
    actionCreator: createEditParty
  },
  address: {
    schema: require('../schema/address.json'),
    getter: getAddress,
    actionCreator: createEditAddress
  }
};

/**
 * View / search licences
 */
const getViewLicences = async (request, h) => {
  const { q, page } = request.query;

  const view = {
    q,
    ...request.view
  };

  if (q) {
    const { data, pagination } = await search(q, page);
    view.licences = data;
    view.pagination = pagination;
  } else {
    const { data, pagination } = await recent(page);
    view.licences = data;
    view.pagination = pagination;
  }

  return h.view('water/abstraction-reform/index', view);
};

/**
 * View a licence, with the original values and abstraction reform values
 * in columns for comparison
 * @param {String} request.params.documentId - CRM document ID
 */
const getViewLicence = async (request, h) => {
  const { documentId } = request.params;
  const { flash } = request.query;

  const form = request.form || setStatusForm(request);

  const { licence, finalState } = await load(documentId);

  const data = prepareData(licence, finalState);

  const permissions = getPermissions(request, finalState);

  const view = {
    flash,
    documentId,
    ...request.view,
    licence,
    form,
    lastEdit: finalState.lastEdit,
    data,
    ...permissions,
    highlightNald: finalState.status === STATUS_IN_PROGRESS,
    highlightAr: finalState.status === STATUS_IN_REVIEW
  };

  return h.view('nunjucks/abstraction-reform/licence.njk', view, { layout: false });
};

/**
 * Gets additional arguments to supply to getter
 * This allows multiple args to be supplied in a single route param
 * E.g. for licence versions where there is an issue number and increment number
 * @param {String} compound ID separated by _
 * @return {Array} arguments
 */
const getAdditionalArgs = (id) => {
  return id ? id.split('_') : [];
};

/**
 * Edit an object from within the licence
 * @param {String} request.params.documentId - CRM document ID for licence
 * @param {String} request.params.type - type of entity, purpose, point etc
 * @param {String} request.params.id - the ID of the entity
 */
const getEditObject = async (request, h) => {
  const {documentId, type, id} = request.params;
  const args = getAdditionalArgs(id);

  // Load licence / AR licence from CRM
  const { licence, finalState } = await load(documentId);

  // Check permissions
  const { canEdit } = getPermissions(request, finalState);
  if (!canEdit) {
    return h.redirect(`/admin/abstraction-reform/licence/${documentId}?flash=locked`);
  }

  const { schema, getter } = objectConfig[type];

  const data = extractData(getter(finalState.licence, ...args), schema);

  const formAction = `/admin/abstraction-reform/licence/${documentId}/edit/${type}${id ? `/${id}` : ''}`;

  const view = {
    ...request.view,
    documentId,
    licence,
    pageTitle: `Edit ${type}`,
    formAction,
    data,
    schema
  };

  return h.view('water/abstraction-reform/edit', view);
};

/**
 * Edits a licence/purpose/point/condition etc.
 */
const postEditObject = async (request, h) => {
  const { documentId, type, id } = request.params;
  const args = getAdditionalArgs(id);
  const { csrf_token: csrfToken, ...rawPayload } = request.payload;

  const payload = transformNulls(rawPayload);

  // Load licence / AR licence from CRM
  const { licence, arLicence, finalState } = await load(documentId);
  const { licence_ref: licenceNumber } = licence;

  // Check permissions
  const { canEdit } = getPermissions(request, finalState);
  if (!canEdit) {
    return h.redirect(`/admin/abstraction-reform/licence/${documentId}?flash=locked`);
  }

  const { schema, getter, actionCreator } = objectConfig[type];

  const data = extractData(getter(finalState.licence, ...args), schema);

  // Compare object data with form payload
  const diff = shallowDiff(data, payload);

  if (diff.updated.length) {
    // Add the new action to the list of actions
    const action = actionCreator(pick(payload, diff.updated), request.auth.credentials, ...args);
    const { actions } = arLicence.licence_data_value;
    actions.push(action);

    // Re-calculate final state
    // This is so we can get the status and last editor details and store these
    // Calculate final state from list of actions to update last editor/status
    const { status, lastEdit } = stateManager(getInitialState(licence), actions);

    // Save action list to permit repo
    await update(arLicence.licence_id, {actions, status, lastEdit}, licenceNumber);
  }

  let path = `/admin/abstraction-reform/licence/${documentId}#${type}${id ? `-${id}` : ''}`;
  return h.redirect(path);
};

/**
 * Sets document status to a different workflow status
 * @param {String} request.params.documentId - the CRM document ID
 * @param {String} request.payload.notes - optional notes
 * @param {String} request.payload.status - new status for document
 */
const postSetStatus = async (request, h) => {
  const { documentId } = request.params;

  const schema = setStatusSchema(request);
  const form = handleRequest(setStatusForm(request), request, schema);

  if (form.isValid) {
    const { notes, status } = getValues(form);

    // Load licence / AR licence from CRM
    const { licence, arLicence } = await load(documentId);
    const { licence_ref: licenceNumber } = licence;

    // Add new action to list
    const action = createSetStatus(status, notes, request.auth.credentials);
    const { actions } = arLicence.licence_data_value;
    actions.push(action);

    // Re-calculate final state
    // This is so we can get the status and last editor details and store these
    // Calculate final state from list of actions to update last editor/status
    const { lastEdit } = stateManager(getInitialState(licence), actions);

    // Save action list to permit repo
    await update(arLicence.licence_id, {actions, status, lastEdit}, licenceNumber);

    return h.redirect(`/admin/abstraction-reform`);
  } else {
    // Re-render licence page
    request.form = form;
    return getViewLicence(request, h);
  }
};

/**
 * A screen to select a custom data point (WR22) to add to existing licence
 * @param  {Object} request - HAPI request interface
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object} h       HAPI reply interface
 * @return {Promise}
 */
const getAddData = (request, h) => {
  const { documentId } = request.params;
  const form = request.form || selectSchemaForm(request, customSchema);

  const categories = getSchemaCategories(customSchema);

  const view = {
    categories,
    ...request.view,
    form,
    back: `/admin/abstraction-reform/licence/${documentId}`
  };

  return h.view('nunjucks/abstraction-reform/add-data.njk', view, { layout: false });
};

/**
 * Post handler for adding new AR schema to licence data
 * @param  {Object} request - HAPI request interface
 * @param {String} request.params.documentId - CRM document ID
 * @param  {Object} h       HAPI reply interface
 * @return {Promise}
 */
const postAddData = (request, h) => {
  const form = handleRequest(selectSchemaForm(request, customSchema), request);

  // If validation errors in form, redisplay with error message
  if (!form.isValid) {
    request.form = form;
    return getAddData(request, h);
  }

  // Otherwise redirect to data capture form
  const { documentId } = request.params;
  const { schema } = getValues(form);

  const path = `/admin/abstraction-reform/licence/${documentId}/add-schema/${schema}`;

  return h.redirect(path);
};

const getEditData = async (request, h) => {
  const { documentId, schema } = request.params;

  const selectedSchema = await dereference(find(customSchema, { id: schema }));

  const path = `/admin/abstraction-reform/licence/${documentId}/add-schema/${schema}`;
  const form = schemaToForm(path, selectedSchema);
  console.log(JSON.stringify(form, null, 2));

  const view = {
    ...request.view,
    form,
    back: `/admin/abstraction-reform/licence/${documentId}/add-data`
  };
  return h.view('nunjucks/abstraction-reform/edit-data.njk', view, { layout: false });
};

module.exports = {
  getViewLicences,
  getViewLicence,
  getEditObject,
  postEditObject,
  postSetStatus,
  getAddData,
  postAddData,
  getEditData
};
