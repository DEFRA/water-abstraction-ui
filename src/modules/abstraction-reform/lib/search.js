/**
 * A module to search for documents iN CRM  based on criteria in for
 * abstraction reform search page, and then match them up with AR "licences"
 * to enable display of status/last editor in list
 */
const Boom = require('boom');
const { find } = require('lodash');

const { documents } = require('../../../lib/connectors/crm');
const { licences } = require('../../../lib/connectors/permit');

/**
 * Combines CRM document header data with AR licence details
 * @param {Array} - list of CRM document headers
 * @param {Array} - list of abstraction reform permit repo "licences"
 * @return {Array} - view data
 */
const combineLicences = (crmLicences, arLicences) => {
  // Combine CRM documents with AR licences
  return crmLicences.map(row => {
    // Find corresponding AR licence
    const arLicence = find(arLicences, { licence_ref: row.system_external_id });

    return {
      id: row.document_id,
      licenceNumber: row.system_external_id,
      lastEdit: arLicence ? arLicence.licence_data_value.lastEdit : null,
      status: arLicence ? arLicence.licence_data_value.status : null
    };
  });
};

/**
 * Load AR licences from CRM doc list
 * @param {Array} CRM doc list
 * @return {Promise} resolves with list of AR licences
 */
const loadAbstractionReformLicences = async (crmLicences) => {
  const arFilter = {
    licence_ref: {
      $in: crmLicences.map(row => row.system_external_id)
    },
    licence_type_id: 10,
    licence_regime_id: 1
  };

  // Load documents
  const { data, error } = await licences.findMany(arFilter);

  if (error) {
    throw new Boom.badImplementation(error);
  }

  return data;
};

const search = async (q) => {
  let filter = {};
  if (q.match('@')) {
    filter.email = q.trim();
  } else {
    filter.string = q.trim();
  }

  const page = 1;

  const sort = {
    system_external_id: +1
  };

    // Get licences from CRM
  const { data, error, pagination } = await documents.getLicences(filter, sort, {
    page,
    perPage: 50
  });
  if (error) {
    throw new Boom.badImplementation(error);
  }

  // Now we need to match up with AR licences
  const arLicences = await loadAbstractionReformLicences(data);

  return { data: combineLicences(data, arLicences), pagination };
};

module.exports = {
  search
};
