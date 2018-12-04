/**
 * A module to search for documents iN CRM  based on criteria in for
 * abstraction reform search page, and then match them up with AR "licences"
 * to enable display of status/last editor in list
 */
const Boom = require('boom');
const { find, get } = require('lodash');

const { documents } = require('../../../lib/connectors/crm');
const { licences } = require('../../../lib/connectors/permit');

const perPage = 50;

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
      lastEdit: get(arLicence, 'licence_data_value.lastEdit'),
      status: get(arLicence, 'licence_data_value.status')
    };
  });
};

/**
 * Combines CRM document header data with AR licence details
 * @param {Array} - list of CRM document headers
 * @param {Array} - list of abstraction reform permit repo "licences"
 * @return {Array} - view data
 */
const combineARLicences = (arLicences, crmLicences) => {
  // Combine CRM documents with AR licences
  return arLicences.map(row => {
    // Find corresponding AR licence
    const crmLicence = find(crmLicences, { system_external_id: row.licence_ref });

    return {
      id: get(crmLicence, 'document_id'),
      licenceNumber: get(row, 'licence_ref'),
      lastEdit: get(row, 'licence_data_value.lastEdit'),
      status: get(row, 'licence_data_value.status')
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
  const { data, error, pagination } = await documents.findMany(filter, sort, {
    page,
    perPage
  });
  if (error) {
    throw new Boom.badImplementation(error);
  }

  // Now we need to match up with AR licences
  const arLicences = await loadAbstractionReformLicences(data);

  return { data: combineLicences(data, arLicences), pagination };
};

/**
 * Get recently edited licences
 * @return {Promise} resolves with array of licences
 */
const recent = async (page) => {
  const filter = {
    licence_type_id: 10,
    licence_regime_id: 1
  };
  const sort = {
    'licence_data_value->lastEdit->timestamp': -1
  };
  const requestPagination = {
    page,
    perPage
  };
  const { data, pagination, error } = await licences.findMany(filter, sort, requestPagination);

  if (error) {
    throw error;
  }

  // Match up with CRM docs
  const crmFilter = {
    system_external_id: {
      $in: data.map(row => row.licence_ref)
    }
  };

  const { data: crmData, error: crmError } = await documents.findMany(crmFilter, null, null, ['document_id', 'system_external_id']);

  if (crmError) {
    throw crmError;
  }

  return { data: combineARLicences(data, crmData), pagination };
};

module.exports = {
  search,
  recent
};
