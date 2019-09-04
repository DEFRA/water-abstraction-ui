const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const bluebird = require('bluebird');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const routeConfigSchema = Joi.object().keys({
  param: Joi.string().default('documentId'),
  load: Joi.object({
    licence: Joi.boolean().valid(true),
    summary: Joi.boolean().valid(true),
    communications: Joi.boolean().valid(true),
    users: Joi.boolean().valid(true),
    primaryUser: Joi.boolean().valid(true),
    company: Joi.boolean().valid(true),
    chargeVersions: Joi.boolean().valid(true)
  })
});

const waterMethods = {
  licence: 'getByDocumentId',
  summary: 'getSummaryByDocumentId',
  communications: 'getCommunicationsByDocumentId',
  users: 'getUsersByExternalId',
  primaryUser: 'getPrimaryUserByDocumentId',
  company: 'getCompanyByDocumentId',
  chargeVersions: 'getChargeVersionsByDocumentId'
};

/**
 * Loads licence data and returns an object
 * @param  {Array}  keys        - the keys to load, e.g. 'summary', 'communications' etc
 * @param  {Object}  request    - HAPI request
 * @param  {String}  documentId - the CRM document ID
 * @param  {Object}  h          - HAPI response toolkit
 * @return {Promise<Object>}
 */
const loadLicenceData = async (keys, request, documentId, h) => {
  const { getLicenceData } = h.realm.pluginOptions;
  const data = {};
  await bluebird.map(keys, async key => {
    const method = waterMethods[key];
    const { error, data: licenceData } = await getLicenceData(method, documentId, request);
    throwIfError(error);
    data[key] = licenceData;
  });
  return data;
};

/**
 * Validates route config options through Joi schema
 * Throws boom error if validation fails
 * @param  {Object} request - HAPI request
 * @return {Object}           config options
 */
const getConfig = request => {
  const { licenceData: config } = request.route.settings.plugins;
  if (!config) {
    return;
  }
  Joi.assert(config, routeConfigSchema, `Invalid licenceData route configuration`);
  const { value } = Joi.validate(config, routeConfigSchema);
  return value;
};

const onPreHandler = async (request, h) => {
  const config = getConfig(request);

  if (!config) {
    return h.continue;
  }

  // Get document ID from request params
  const documentId = request.params[config.param];

  try {
    // Load licence data and store on HAPI request instance
    const keys = Object.keys(config.load);
    request.licence = await loadLicenceData(keys, request, documentId, h);
  } catch (err) {
    const { credentials } = request.auth;
    request.log('error', 'Error getting licence data', { load: request.load, documentId, credentials });
    Boom.boomify(err, { statusCode: err.statusCode });
    throw err;
  }

  return h.continue;
};

module.exports = {
  register: (server) => {
    server.ext({
      type: 'onPreHandler',
      method: onPreHandler
    });
  },
  pkg: {
    name: 'licenceDataPlugin',
    version: '1.0.0'
  },
  _onPreHandler: onPreHandler
};
