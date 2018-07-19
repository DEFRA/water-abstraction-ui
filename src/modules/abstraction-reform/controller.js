const { pick } = require('lodash');
const shallowDiff = require('shallow-diff');

const { load, update } = require('./lib/loader');
const { extractData, transformNulls, prepareData } = require('./lib/helpers');
const { getPurpose, getLicence, getPoint, getCondition } = require('./lib/licence-helpers');
const { createEditPurpose, createEditLicence, createEditPoint, createEditCondition, createSetStatus } = require('./lib/action-creators');
const { stateManager, getInitialState } = require('./lib/state-manager');
const { search } = require('./lib/search');
const { STATUS_IN_PROGRESS } = require('./lib/statuses');

// Config for editing different data models
const objectConfig = {
  licence: {
    schema: require('./schema/licence.json'),
    getter: getLicence,
    actionCreator: createEditLicence
  },
  purpose: {
    schema: require('./schema/purpose.json'),
    getter: getPurpose,
    actionCreator: createEditPurpose
  },
  point: {
    schema: require('./schema/point.json'),
    getter: getPoint,
    actionCreator: createEditPoint
  },
  condition: {
    schema: require('./schema/condition.json'),
    getter: getCondition,
    actionCreator: createEditCondition
  }
};

/**
 * View / search licences
 */
const getViewLicences = async (request, h) => {
  const { q } = request.query;

  const { view } = request;

  if (q) {
    const { data, pagination } = await search(q);
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

  const { licence, finalState } = await load(documentId);

  const data = prepareData(licence, finalState);

  // User can only edit if no status / in progress
  const canEdit = finalState.status === STATUS_IN_PROGRESS;
  const canReview = request.permissions.ar.review;

  // const { generateJsonSchema } = require('./lib/helpers');
  // const path = require('path');
  // const fs = require('fs');
  // fs.writeFileSync(path.join(__dirname, 'schema/condition.json'), JSON.stringify(generateJsonSchema(data.conditions[0].base), null, 2));

  const view = {
    documentId,
    ...request.view,
    licence,
    data,
    canEdit,
    canReview
  };

  return h.view('water/abstraction-reform/licence', view);
};

/**
 * Edit an object from within the licence
 * @param {String} request.params.documentId - CRM document ID for licence
 * @param {String} request.params.type - type of entity, purpose, point etc
 * @param {String} request.params.id - the ID of the entity
 */
const getEditObject = async (request, h) => {
  const {documentId, type, id} = request.params;

  // Load licence / AR licence from CRM
  const { finalState } = await load(documentId);

  const { schema, getter } = objectConfig[type];

  const data = extractData(getter(finalState.licence, id), schema);

  const view = {
    ...request.view,
    documentId,
    pageTitle: `Edit ${type}`,
    formAction: `/admin/abstraction-reform/licence/${documentId}/edit/${type}/${id}`,
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
  const { csrf_token: csrfToken, ...rawPayload } = request.payload;

  const payload = transformNulls(rawPayload);

  // Load licence / AR licence from CRM
  const { licence, arLicence, finalState } = await load(documentId);

  const { schema, getter, actionCreator } = objectConfig[type];

  const data = extractData(getter(finalState.licence, id), schema);

  // Compare object data with form payload
  const diff = shallowDiff(data, payload);
  if (diff.updated.length) {
    // Add the new action to the list of actions
    const action = actionCreator(pick(payload, diff.updated), request.auth.credentials, id);
    const { actions } = arLicence.licence_data_value;
    actions.push(action);

    // Re-calculate final state
    // This is so we can get the status and last editor details and store these
    // Calculate final state from list of actions to update last editor/status
    const { status, lastEdit } = stateManager(getInitialState(licence), actions);

    // Save action list to permit repo
    await update(arLicence.licence_id, {actions, status, lastEdit});
  }

  return h.redirect(`/admin/abstraction-reform/licence/${documentId}#${type}-${id}`);
};

/**
 * Sets document status to a different workflow status
 * @param {String} request.params.documentId - the CRM document ID
 * @param {String} request.payload.notes - optional notes
 * @param {String} request.payload.status - new status for document
 */
const postSetStatus = async (request, h) => {
  const { documentId } = request.params;
  const { notes, status } = request.payload;

  // Load licence / AR licence from CRM
  const { licence, arLicence } = await load(documentId);

  // Add new action to list
  const action = createSetStatus(status, notes, request.auth.credentials);
  const { actions } = arLicence.licence_data_value;
  actions.push(action);

  // Re-calculate final state
  // This is so we can get the status and last editor details and store these
  // Calculate final state from list of actions to update last editor/status
  const { lastEdit } = stateManager(getInitialState(licence), actions);

  // Save action list to permit repo
  await update(arLicence.licence_id, {actions, status, lastEdit});

  return h.redirect(`/admin/abstraction-reform`);
};

module.exports = {
  getViewLicences,
  getViewLicence,
  getEditObject,
  postEditObject,
  postSetStatus
};
