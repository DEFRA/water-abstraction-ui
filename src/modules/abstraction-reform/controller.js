const { load, update } = require('./lib/loader');
const { filterScalars, generateJsonSchema, extractData, transformNulls } = require('./lib/helpers');
const { getPurposes, getPurpose, getLicence } = require('./lib/licence-helpers');
const { pick } = require('lodash');
const shallowDiff = require('shallow-diff');
const { createEditPurpose, createEditLicence } = require('./lib/action-creators');

/**
 * Prepares data for use in single licence view
 * @param {Object} licence - the base licence
 * @param {Object} finalState - the final state from the reducer
 * @return {Object} view data
 */
const prepareData = (licence, finalState) => {
  // Prepare licence
  const base = {
    base: filterScalars(licence.licence_data_value),
    reform: filterScalars(finalState.licence)
  };

  // Prepare purposes
  // @TODO - we will need to compare to check for deleted/added items
  const purposes = getPurposes(licence.licence_data_value).map((purpose, index) => {
    return {
      base: filterScalars(purpose),
      reform: filterScalars(getPurposes(finalState.licence)[index])
    };
  });

  return {
    licence: base,
    purposes
  };
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

  // require('fs').writeFileSync('schema.json', JSON.stringify(generateJsonSchema(data.licence.base), null, 2));

  const view = {
    documentId,
    ...request.view,
    licence,
    data
  };

  return h.view('water/abstraction-reform/licence', view);
};

const objectConfig = {
  purpose: {
    schema: require('./schema/purpose.json'),
    getter: getPurpose,
    actionCreator: createEditPurpose
  },
  licence: {
    schema: require('./schema/licence.json'),
    getter: getLicence,
    actionCreator: createEditLicence
  }
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
    pageTitle: `Edit ${type}`,
    formAction: `/admin/abstraction-reform/licence/${documentId}/edit/${type}/${id}`,
    data,
    schema
  };

  return h.view('water/abstraction-reform/edit', view);
};

const postEditObject = async (request, h) => {
  const { documentId, type, id } = request.params;
  const { csrf_token: csrfToken, ...rawPayload } = request.payload;

  const payload = transformNulls(rawPayload);

  // Load licence / AR licence from CRM
  const { arLicence, finalState } = await load(documentId);

  const { schema, getter, actionCreator } = objectConfig[type];

  const data = extractData(getter(finalState.licence, id), schema);

  // Compare object data with form payload
  const diff = shallowDiff(data, payload);
  if (diff.updated.length) {
    const action = actionCreator(pick(payload, diff.updated), request.auth.credentials, id);
    const { actions } = arLicence.licence_data_value;
    actions.push(action);
    // Save action list to permit repo
    await update(arLicence.licence_id, actions);
  }

  return h.redirect(`/admin/abstraction-reform/licence/${documentId}#${type}-${id}`);
};

module.exports = {
  getViewLicence,
  getEditObject,
  postEditObject
};
