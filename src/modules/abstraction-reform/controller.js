const { load, update } = require('./lib/loader');
const { filterScalars } = require('./lib/helpers');
const { getPurposes } = require('./lib/licence-helpers');
const { find, pick } = require('lodash');
const shallowDiff = require('shallow-diff');
const { createEditPurpose } = require('./lib/action-creators');

/**
 * View a licence, with the original values and abstraction reform values
 * in columns for comparison
 * @param {String} request.params.documentId - CRM document ID
 */
const getLicence = async (request, h) => {
  const { documentId } = request.params;

  const { licence, finalState } = await load(documentId);

  // Prepare purposes
  // @TODO - we will need to compare to check for deleted/added items
  const purposes = getPurposes(licence.licence_data_value).map((purpose, index) => {
    console.log(JSON.stringify(purpose, null, 2));

    return {
      base: filterScalars(purpose),
      reform: filterScalars(getPurposes(finalState.licence)[index])
    };
  });

  const view = {
    documentId,
    ...request.view,
    licence: licence.licence_data_value,
    purposes
  };

  return h.view('water/abstraction-reform/licence', view);
};

const extractData = (object, schema) => {
  return pick(object, Object.keys(schema.properties));
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

  let data, schema;

  if (type === 'purpose') {
    schema = require('./schema/purpose.json');
    const purpose = find(getPurposes(finalState.licence), {ID: id});
    data = extractData(purpose, schema);
  }

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
  const { csrf_token: csrfToken, ...payload } = request.payload;

  // Load licence / AR licence from CRM
  const { licence, arLicence, finalState } = await load(documentId);

  let data, schema, redirect = `/admin/abstraction-reform/licence/${documentId}`;

  if (type === 'purpose') {
    schema = require('./schema/purpose.json');
    const purpose = find(getPurposes(finalState.licence), {ID: id});
    data = extractData(purpose, schema);

    // Compare posted data with current data, create action for action log
    const diff = shallowDiff(data, payload);
    if (diff.updated.length) {
      const action = createEditPurpose(id, pick(payload, diff.updated), request.auth.credentials);

      const { actions } = arLicence.licence_data_value;
      actions.push(action);

      console.log(actions);

      await update(arLicence.licence_id, actions);

      return h.redirect(`${redirect}#purpose-${id}`);
      // Save
      // arLicence.licence_data_value.actions.push(action);

      // return arLicence;
    }
  }
};

module.exports = {
  getLicence,
  getEditObject,
  postEditObject
};
