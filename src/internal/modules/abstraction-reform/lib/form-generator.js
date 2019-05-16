const { URL } = require('url');
const RefParser = require('json-schema-ref-parser');
const { pick, isObject, each, get, cloneDeep } = require('lodash');
const sentenceCase = require('sentence-case');
const apiHelpers = require('./api-helpers');
const { formFactory, fields } = require('../../../../shared/lib/forms');
const licencesConnector = require('../../../lib/connectors/water-service/licences');

const { mapConditionText } = require('./map-condition');

const types = {
  ngr: require('../schema/types/ngr.json'),
  measurementPoint: require('../schema/types/measurement-point.json'),
  measurementPointType: require('../schema/types/measurement-point-type.json'),
  measurementPointRefPoint: require('../schema/types/measurement-point-ref-point.json'),
  rate: require('../schema/types/rate.json'),
  purpose: require('../schema/types/purpose.json'),
  waterBodies: require('../schema/types/water-bodies.json'),
  gaugingStations: require('../schema/types/gauging-stations.json')
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

const mapCondition = condition => ({ id: condition.id, value: mapConditionText(condition) });

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
  const refParser = new RefParser();
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
  return get(item, 'label', defaultLabel);
};

/**
 * Converts a scalar enum choice to a form object choice.
 * @param  {Object} item - enum choice
 * @return {Object}      form object choice
 */
const mapScalarEnumChoice = item => ({ label: item, value: item });

/**
 * If the enum values are to be rendered as a dropdown, and the default
 * value is to be empty (so not to select the first item) then
 * add the appropriate empty value for a object or scalar enum.
 */
const getEnumFieldChoices = item => {
  if (item.defaultEmpty && item.enum.length > 5) {
    const empty = isObject(item.enum[0])
      ? { label: '', value: '' }
      : '';

    return [empty, ...item.enum];
  }
  return item.enum;
};

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
  const errors = get(item, 'errors');
  const label = guessLabel(fieldName, item);
  const hint = get(item, 'hint');

  const fieldFactory = item.enum.length > 5 ? fields.dropdown : fields.radio;
  const choices = getEnumFieldChoices(item);

  // Object enum items
  if (isObject(item.enum[0])) {
    return fieldFactory(fieldName, {
      label,
      hint,
      choices,
      keyProperty: 'id',
      labelProperty: 'value',
      errors,
      mapper: 'objectMapper'
    });
  }

  // Scalar enum values (string/number)
  const mapper = item.type === 'number' ? 'numberMapper' : 'defaultMapper';
  return fieldFactory(fieldName, { label, hint, choices: choices.map(mapScalarEnumChoice), mapper, errors });
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
 * Gets common field options (label, hint errors) from JSON schema item
 * @param  {Object} item - the JSON schema field
 * @param  {String} key  - the key of the JSON schema field
 * @return {[type]}      options object { errors, label, hint }
 */
const getFieldOptions = (item, key) => {
  const errors = get(item, 'errors', {});
  const label = guessLabel(key, item);
  const hint = get(item, 'hint');
  return {
    errors, label, hint
  };
};

const getFieldType = (item) => {
  if (item.fieldType) {
    return item.fieldType;
  }
  if (item.type === 'boolean') {
    return 'boolean';
  }
  if ('enum' in item) {
    return 'enum';
  }
  return 'default';
};

const getField = (item, key) => {
  const options = getFieldOptions(item, key);
  const type = getFieldType(item);

  const actions = {
    date: () => { return fields.date(key, options); },
    boolean: () => {
      return fields.radio(key, {
        ...options,
        choices: [
          { value: false, label: 'Yes' },
          { value: true, label: 'No' }
        ],
        mapper: 'booleanMapper'
      });
    },
    enum: () => { return createEnumField(key, item); },
    default: () => {
    // Scalar values (string/number)
      const mapper = item.type === 'number' ? 'numberMapper' : 'defaultMapper';
      return fields.text(key, { ...options, mapper });
    }
  };

  return actions[type]();
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
      let field = getField(item, key);

      const toggle = get(item, 'toggle');
      if (toggle) {
        field = addAttribute(field, 'data-toggle', toggle);
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
  addAttribute,
  createEnumField
};
