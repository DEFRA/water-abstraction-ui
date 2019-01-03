const { URL } = require('url');
const refParser = require('json-schema-ref-parser');
const { pick, isObject, each, get, cloneDeep } = require('lodash');
const sentenceCase = require('sentence-case');
const apiHelpers = require('./api-helpers');
const { formFactory, fields } = require('../../../lib/forms');
const licencesConnector = require('../../../lib/connectors/water-service/licences');

const types = {
  ngr: require('../schema/types/ngr.json'),
  measurementPoint: require('../schema/types/measurement-point.json'),
  rate: require('../schema/types/rate.json'),
  purpose: require('../schema/types/purpose.json')
};

const createEnumsObject = (items, iteratee) => ({
  type: 'object',
  enum: items.map(iteratee)
});

/**
 * Given a picklist record and an array of picklist items loaded from the
 * water service, generates a JSON schema for this picklist data
 * @param {Object} picklist - picklist object from water service
 * @param {Array} items - picklist items from water service
 * @return {Object} JSON schema
 */
const picklistSchemaFactory = (picklist, items) => {
  if (picklist.id_required) {
    return createEnumsObject(items, item => pick(item, 'id', 'value'));
  }

  return {
    type: 'string',
    enum: items.map(item => item.value)
  };
};

const mapCondition = condition => ({ id: condition.id, value: condition.text });

const mapPoint = point => ({ id: point.id, value: point.name });

const resolveLicenceData = async (context, connectorFn, mapFn) => {
  const { data } = await connectorFn(context.documentId);
  return createEnumsObject(data, mapFn);
};

const resolveLicenceConditions = async context => {
  const connector = licencesConnector.getLicenceConditionsByDocumentId;
  return resolveLicenceData(context, connector, mapCondition);
};

const resolveLicencePoints = async context => {
  const connector = licencesConnector.getLicencePointsByDocumentId;
  return resolveLicenceData(context, connector, mapPoint);
};

const licenceResolvers = {
  conditions: resolveLicenceConditions,
  points: resolveLicencePoints
};

const resolveLicences = async (ref, context) => {
  return licenceResolvers[ref](context, ref);
};

const resolvePicklists = async ref => {
  const picklist = await apiHelpers.getPicklist(ref);
  const items = await apiHelpers.getPicklistItems(ref);
  return picklistSchemaFactory(picklist, items);
};

const resolveTypes = async ref => {
  return types[ref];
};

const hostLevelResolvers = {
  picklists: resolvePicklists,
  licences: resolveLicences,
  types: resolveTypes
};

/**
 * A resolver for json-schema-ref-parser
 * This allows refs to be parsed and the relevant schema data to be
 * retrieved
 */
const waterResolverFactory = context => ({
  order: 1,

  canRead: /^water:\/\//i,

  read: async function (file) {
    // Parse URL
    const { host, pathname } = new URL(file.url);

    const ref = pathname.replace('/', '').replace('.json', '');

    const resolver = hostLevelResolvers[host];
    const resolved = await resolver(ref, context);
    return resolved;
  }
});

/**
 * Converts references in the schema to their literals
 * @param {Object} schema - JSON schema with refs
 * @return {Promise} resolves with JSON schema with references converted to literals
 */
const dereference = async (schema, context) => {
  const populated = await refParser.dereference(schema, {
    resolve: {
      waterResolver: waterResolverFactory(context)
    }
  });
  return populated;
};

/**
 * Guess label given a field name
 * Converts underscore to space and converts to sentence case
 * @param {String} str - field name, snake case
 * @return {String} label
 */
const guessLabel = (str, item) => {
  const defaultLabel = sentenceCase(str.replace(/_+/g, ' '));
  return get(item, 'ui.label', defaultLabel);
};

/**
 * Converts a scalar enum choice to a form object choice.
 * @param  {Object} item - enum choice
 * @return {Object}      form object choice
 */
const mapScalarEnumChoice = item => ({ label: item, value: item });

/**
 * Create a field for an enum in the JSON schema
 * The data in the enum can either be an array of scalers or objects
 * If objects, it expects the format { id : 'x', value : 'y'}
 * It selects a radio field for <= 5 items, or a dropdown otherwise
 * @param  {String} fieldName - The JSON schema field name
 * @param  {Object} item      - the field definition from the JSON schema
 * @return {Object}           dropdown/radio field object
 */
const createEnumField = (fieldName, item) => {
  const errors = get(item, 'ui.errors');

  const fieldFactory = item.enum.length > 5 ? fields.dropdown : fields.radio;

  const label = guessLabel(fieldName, item);

  // Object enum items
  if (isObject(item.enum[0])) {
    return fieldFactory(fieldName, { label, choices: item.enum, keyProperty: 'id', labelProperty: 'value', errors, mapper: 'objectMapper' });
  } else {
    // Scalar enum values (string/number)
    const mapper = item.type === 'number' ? 'numberMapper' : 'defaultMapper';
    return fieldFactory(fieldName, { label, choices: item.enum.map(mapScalarEnumChoice), mapper, errors });
  }
};

/**
 * Given a field name and the JSON schema, detects whether this field
 * is dependent on another enum field having a certain value
 * It returns attributes to add to the field in the JSON encode format:
 * {'data-toggle' : '{ fieldName : 'value'}'}
 * @param  {String} fieldName - the field name in the JSON schema
 * @param {Object} schema - the entire JSON schema
 * @return {Object} attributes to add to the field
 */
const getFieldConditional = (fieldName, schema) => {
  return get(schema, `properties.${fieldName}.ui.toggle`, null);
};

/**
 * Adds a named attribute key/value pair to the field
 * The value is JSON stringified if object, otherwise toString is called
 * @param {Object} field - form field object
 * @param {String} name - the attribute name
 * @param {Mixed} value - the attribute value
 * @return {Object} updated field object
 */
const addAttribute = (field, name, value) => {
  const f = cloneDeep(field);
  const val = isObject(value) ? JSON.stringify(value) : value.toString();
  const attr = get(f, 'options.attr', {});
  f.options.attr = {
    ...attr,
    [name]: val
  };
  return f;
};

/**
 * Creates a list of fields for the HTML form by recursing over all object
 * properties in a JSON schema
 * Nested property names must be unique.
 * @param  {Object} schema         - JSON schema
 * @return {Array}                 - array of field objects
 */
const getFields = (schema) => {
  const fieldList = [];
  each(schema.properties, (item, key) => {
    if (item.type === 'object' && item.properties) {
      fieldList.push(...getFields(item));
    } else {
      const errors = get(item, 'ui.errors');
      const label = guessLabel(key, item);
      let field;

      if (item.type === 'boolean') {
        field = fields.radio(key, { label,
          choices: [
            { value: false, label: 'Yes' },
            { value: true, label: 'No' }
          ],
          mapper: 'booleanMapper',
          errors
        });
      } else if ('enum' in item) {
        field = createEnumField(key, item);
      } else {
        // Scalar values (string/number)
        const mapper = item.type === 'number' ? 'numberMapper' : 'defaultMapper';
        field = fields.text(key, { label, mapper, errors });
      }

      const conditionals = getFieldConditional(key, schema);
      if (conditionals) {
        field = addAttribute(field, 'data-toggle', conditionals);
      }

      fieldList.push(field);
    }
  });
  return fieldList;
};

/**
 * Given a JSON schema for WR22 condition, generates a form object
 * for rendering in the UI
 * @param {String} action - form action
 * @param {Object} schema - JSON schema object
 */
const schemaToForm = (action, request, schema) => {
  const { csrfToken } = request.view;
  const f = formFactory(action, 'POST', 'jsonSchema');

  // Add CSRF token hidden field
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  // Add fields from JSON schema
  f.fields.push(...getFields(schema));

  // Add submit button
  f.fields.push(fields.button(null, { label: 'Submit' }));

  return f;
};

module.exports = {
  dereference,
  picklistSchemaFactory,
  schemaToForm,
  guessLabel,
  getFieldConditional,
  addAttribute
};
