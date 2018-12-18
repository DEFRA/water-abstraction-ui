const { find, omit, get } = require('lodash');

const { setValues } = require('../../../lib/forms');
const { load } = require('./loader');
const { wr22 } = require('./schema');
const { dereference, schemaToForm } = require('./form-generator.js');
const { createAddData, createEditData } = require('./action-creators');
const { stateManager, getInitialState } = require('./state-manager');
const { update } = require('../lib/loader');

/**
 * Gets a WR22 schema by name (ID in JSON schema)
 * @param  {String} schemaName - the name/ID of the schema
 * @return {Object}            the JSON schema
 */
const getSchema = (schemaName) => {
  const schema = find(wr22, { id: schemaName });
  return dereference(schema);
};

/**
 * Finds a WR22 data item by ID in the AR final state licence
 * @param  {Object} arLicence - AR licence after being passed through reducer
 * @param  {String} id        - GUID - ID of condition
 * @return {Object}           data item
 */
const findDataItem = (arLicence, id) => {
  return find(arLicence.licence.arData, { id });
};

/**
 * When adding a data point, gets the form and schema
 * @param  {Object}  request - HAPI request
 * @return {Promise}         resolves with { schema, form }
 */
const getAddFormAndSchema = async (request) => {
  const { documentId, schema: schemaName } = request.params;

  const action = `/admin/abstraction-reform/licence/${documentId}/add-data/${schemaName}`;

  const schema = await getSchema(schemaName);
  const form = schemaToForm(action, request, schema);

  return { schema, form };
};

/**
 * When editing a data point, gets the form and schema
 * @param  {Object}  request - HAPI request
 * @return {Promise}         resolves with form, schema and various other info
 */
const getEditFormAndSchema = async (request) => {
  const { id, documentId } = request.params;

  // Form action
  const action = `/admin/abstraction-reform/licence/${documentId}/edit-data/${id}`;

  // Load AR licence
  const result = await load(documentId);

  const item = findDataItem(result.finalState, id);
  const schema = await getSchema(item.schema);

  const form = setValues(schemaToForm(action, request, schema), item.content);

  return {
    ...result,
    form,
    schema
  };
};

/**
 * Gets licence issue and increment number
 * @param  {Object} licence - the permit repo licence
 * @return {Object}         { issueNumber, incrementNumber }
 */
const getLicenceVersion = (licence) => {
  const issueNumber = get(licence, 'licence_data_value.data.current_version.licence.ISSUE_NO');
  const incrementNumber = get(licence, 'licence_data_value.data.current_version.licence.INCR_NO');
  return {
    issueNumber,
    incrementNumber
  };
};

/**
 * Creates an 'add' WR22 data point action object
 * @param {Object} request - HAPI request
 * @param {Object} licence - base licence data
 * @return {Object} action
 */
const addActionFactory = (request, licence) => {
  const { schema: schemaName } = request.params;
  const { credentials: user } = request.auth;
  const { issueNumber, incrementNumber } = getLicenceVersion(licence);
  return createAddData(schemaName, user, issueNumber, incrementNumber);
};

/**
 * Creates an 'edit' existing WR22 data point action object
 * @param {Object} request - HAPI request
 * @param {Object} data - form data
 * @param {String} id - GUID for the data point
 * @return {Object} action
 */
const editActionFactory = (request, data, id) => {
  const { credentials: user } = request.auth;
  return createEditData(omit(data, ['csrf_token']), user, id);
};

/**
 * Persists an array of action objects on to the specified licence
 * @param  {String}  licenceNumber - the licence number
 * @param  {Object}  licence       - the base licence data
 * @param  {Object}  arLicence     - the AR licence data
 * @param  {Array}   [actions=[]]  - a list of actions to add to the AR licence
 * @return {Promise}               resolves when AR licence updated
 */
const persistActions = async (licence, arLicence, actions = []) => {
  const { licence_ref: licenceNumber } = licence;

  // Add the new action to the list of actions
  const updatedActions = [...arLicence.licence_data_value.actions, ...actions];

  // Re-calculate final state
  const { status, lastEdit } = stateManager(getInitialState(licence), updatedActions);

  // Save action list to permit repo
  return update(arLicence.licence_id, { actions: updatedActions, status, lastEdit }, licenceNumber);
};

module.exports = {
  getSchema,
  findDataItem,
  getAddFormAndSchema,
  getEditFormAndSchema,
  addActionFactory,
  editActionFactory,
  persistActions
};
