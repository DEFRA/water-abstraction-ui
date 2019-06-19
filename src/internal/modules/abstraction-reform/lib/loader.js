const Boom = require('boom');
const services = require('../../../lib/connectors/services');
const { licences } = require('../../../lib/connectors/permit');
const { stateManager, getInitialState } = require('./state-manager');
const { transformNulls } = require('./helpers');

/**
 * Loads or creates an abstraction reform "licence" for the specified
 * licence number
 * @param {String} licenceRef
 */
const loadOrCreateARLicence = async (licenceRef) => {
  const filter = {
    licence_regime_id: 1,
    licence_type_id: 10,
    licence_ref: licenceRef
  };

  const { error, data } = await licences.findMany(filter);

  if (error) {
    throw Boom.badImplementation('Permit error', error);
  }

  if (data.length === 1) {
    return data[0];
  }

  if (data.length === 0) {
    const licenceData = {
      actions: []
    };

    const { error: createError, data: createData } = await licences.create({
      ...filter,
      licence_data_value: JSON.stringify(licenceData),
      metadata: '{}'
    });

    if (createError) {
      throw Boom.badImplementation('Permit error creating AR licence', createError);
    }

    return createData;
  }
};

/**
 * Loads both the abstraction licence, and an existing/created abstraction reform licence
 * for the specified CRM documentId
 * @param {String} documentId - the CRM document ID GUID
 * @return {Promise} resolves with rows of data from permit repo, licence for base licence and arLicence for abstraction reform data
 */
const loadLicence = async (documentId) => {
  // Load abstraction licence
  const { error, data: { system_internal_id: licenceId } } = await services.crm.documents.findOne(documentId);

  if (error) {
    throw Boom.badImplementation('CRM error', error);
  }

  // Load permit repo licence
  const { error: permitError, data: permitData } = await licences.findOne(licenceId);

  if (permitError) {
    throw Boom.badImplementation('Permit error', permitError);
  }

  const arLicence = await loadOrCreateARLicence(permitData.licence_ref);

  return {
    licence: {
      ...permitData,
      licence_data_value: transformNulls(permitData.licence_data_value)
    },
    arLicence
  };
};

/**
 * Load all data required in AR screens, resolves with:
 *
 * - licence - the abstraction licence
 * - arLicence - the abstraction reform licence containing action list
 * - finalState - the result of running the licence and AR through the reducer
 *
 * @param {String} documentId - the CRM document ID
 * @return {Promise} resolves with {licence, arLicence, finalState }
 */
const load = async (documentId) => {
  const { licence, arLicence } = await loadLicence(documentId);

  // Setup initial state
  const initialState = getInitialState(licence);

  // Calculate final state after actions applied
  const finalState = stateManager(initialState, arLicence.licence_data_value.actions);

  return {
    licence,
    arLicence,
    finalState
  };
};

/**
 * Updates AR licence with new actions list
 * @param {String} licenceId - primary key of licence in permit repo
 * @param {Object} data - AR licence data
 * @param {String} licenceNumber
 * @return {Promise}
 */
const update = async (licenceId, data, licenceNumber) => {
  const payload = {
    licence_data_value: JSON.stringify(data)
  };
  const result = await licences.updateOne(licenceId, payload);
  await services.water.abstractionReformAnalysis.arRefreshLicenceWebhook(licenceNumber);
  return result;
};

module.exports = {
  load,
  update
};
