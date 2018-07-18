const Boom = require('boom');
const { documents } = require('../../../lib/connectors/crm');
const { licences } = require('../../../lib/connectors/permit');

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
  const { error, data: { system_internal_id: licenceId } } = await documents.findOne(documentId);

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
    licence: permitData,
    arLicence
  };
};

module.exports = {
  loadLicence
};
