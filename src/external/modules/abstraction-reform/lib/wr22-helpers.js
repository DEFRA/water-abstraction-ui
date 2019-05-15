const { find, omit, get, mapValues, isObject } = require('lodash');

const { setValues } = require('../../../lib/forms');
const loader = require('./loader');
const { getWR22 } = require('./schema');
const formGenerator = require('./form-generator');
const { createAddData, createEditData } = require('./action-creators');
const { stateManager, getInitialState } = require('./state-manager');

/**
 * Gets a WR22 schema by name (ID in JSON schema)
 * @param  {String} schemaName - the name/ID of the schema
 * @return {Object}            the JSON schema
 */
const getSchema = (schemaName) => {
  const item = find(getWR22(), { id: schemaName });
  if (item) {
    return item;
  }
  throw new Error(`Schema with name "${schemaName}" not found`);
};

/**
 * Finds a WR22 data item by ID in the AR final state licence
 * @param  {Object} arLicence - AR licence after being passed through reducer
 * @param  {String} id        - GUID - ID of condition
 * @return {Object}           data item
 */
const findDataItem = (arLicence, id) => {
  const item = find(arLicence.licence.arData, { id });
  if (item) {
    return item;
  }
  throw new Error(`Data item with id "${id}" not found`);
};

/**
 * Gets the action attribute for the add schema form
 * @param  {String} documentId - the CRM document ID for the licence
 * @param  {String} schemaName - WR22 schema to add
 * @return {String}            form action attribute
 */
const getAddFormAction = (documentId, schemaName) => {
  return `/admin/digitise/licence/${documentId}/add-data/${schemaName}`;
};

/**
 * When adding a data point, gets the form and schema
 * @param  {Object}  request - HAPI request
 * @return {Promise}         resolves with { schema, form }
 */
const getAddFormAndSchema = async (request) => {
  const { documentId, schema: schemaName } = request.params;

  const action = getAddFormAction(documentId, schemaName);
  const schema = await formGenerator.dereference(getSchema(schemaName), { documentId });
  const form = formGenerator.schemaToForm(action, request, schema);

  return { schema, form };
};

/**
 * Picklist item objects have a 'value' and 'id' property.  This function
 * checks whether the supplied object has these properties
 * @param  {Object}  item - object to check
 * @return {Boolean}      true if item only has keys 'id' and 'value'
 */
const isPicklistItemWithId = (item) => {
  const keys = Object.keys(item);
  return keys.includes('id') && keys.includes('value');
};

const flattenObject = (item) => {
  if (isPicklistItemWithId(item)) {
    return item;
  }
  return flattenData(item);
};
/**
 * Maps data stored in the AR final state to a flat object ready for setting
 * values in a form object
 * @param  {Object} obj - the data stored in the AR licence final state
 * @return {Object}     - shallow object with all properties at root level
 */
const flattenData = (obj) => {
  let result = {};
  mapValues(obj, (item, key) => {
    let data;
    if (!isObject(item) || isPicklistItemWithId(item)) {
      data = { [key]: item };
    } else {
      data = flattenObject(item);
    }
    Object.assign(result, data);
  });
  return result;
};

/**
 * When editing a data point, gets the form and schema
 * @param  {Object}  request - HAPI request
 * @return {Promise}         resolves with form, schema and various other info
 */
const getEditFormAndSchema = async (request) => {
  const { id, documentId } = request.params;

  // Form action
  const action = `/admin/digitise/licence/${documentId}/edit-data/${id}`;

  // Load AR licence
  const result = await loader.load(documentId);

  const item = findDataItem(result.finalState, id);

  const schema = await formGenerator.dereference(getSchema(item.schema), { documentId });

  const values = flattenData(item.content);
  const form = setValues(formGenerator.schemaToForm(action, request, schema), values);

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
    issueNumber: parseInt(issueNumber),
    incrementNumber: parseInt(incrementNumber)
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
  return loader.update(arLicence.licence_id, { actions: updatedActions, status, lastEdit }, licenceNumber);
};

exports.getSchema = getSchema;
exports.findDataItem = findDataItem;
exports.getAddFormAction = getAddFormAction;
exports.getAddFormAndSchema = getAddFormAndSchema;
exports.getEditFormAndSchema = getEditFormAndSchema;
exports.addActionFactory = addActionFactory;
exports.editActionFactory = editActionFactory;
exports.persistActions = persistActions;
exports.getLicenceVersion = getLicenceVersion;
exports.flattenData = flattenData;
