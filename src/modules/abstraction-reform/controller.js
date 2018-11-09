const { pick } = require('lodash');
const shallowDiff = require('shallow-diff');

const { load, update } = require('./lib/loader');
const { extractData, transformNulls, prepareData } = require('./lib/helpers');
const { getPermissions } = require('./lib/permissions');
const { getPurpose, getLicence, getPoint, getCondition, getCurrentVersion } = require('./lib/licence-helpers');
const { createEditPurpose, createEditLicence, createEditPoint, createEditCondition, createSetStatus, createEditCurrentVersion } = require('./lib/action-creators');
const { stateManager, getInitialState } = require('./lib/state-manager');
const { search, recent } = require('./lib/search');
const { STATUS_IN_PROGRESS, STATUS_IN_REVIEW } = require('./lib/statuses');

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
  },
  'current-version': {
    schema: require('./schema/current-version.json'),
    getter: getCurrentVersion,
    actionCreator: createEditCurrentVersion
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

  const { licence, finalState } = await load(documentId);

  const data = prepareData(licence, finalState);

  const permissions = getPermissions(request, finalState);

  const view = {
    flash,
    documentId,
    ...request.view,
    licence,
    lastEdit: finalState.lastEdit,
    data,
    ...permissions,
    highlightNald: finalState.status === STATUS_IN_PROGRESS,
    highlightAr: finalState.status === STATUS_IN_REVIEW
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
  const { licence, finalState } = await load(documentId);

  // Check permissions
  const { canEdit } = getPermissions(request, finalState);
  if (!canEdit) {
    return h.redirect(`/admin/abstraction-reform/licence/${documentId}?flash=locked`);
  }

  const { schema, getter } = objectConfig[type];

  const data = extractData(getter(finalState.licence, id), schema);

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
  const { csrf_token: csrfToken, ...rawPayload } = request.payload;

  const payload = transformNulls(rawPayload);

  // Load licence / AR licence from CRM
  const { licence, arLicence, finalState } = await load(documentId);

  // Check permissions
  const { canEdit } = getPermissions(request, finalState);
  if (!canEdit) {
    return h.redirect(`/admin/abstraction-reform/licence/${documentId}?flash=locked`);
  }

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
  const { notes, status } = request.payload;

  if (request.formError) {
    return getViewLicence(request, h);
  }

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
