'use strict';

const { pick } = require('lodash');

/**
 * @note the water company API currently accepts addressId rather than id
 * as it should
 */
const mapAddressToWaterApi = address => ({
  ...address.id && { addressId: address.id },
  ...pick(address, [
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'addressLine4',
    'town',
    'county',
    'country',
    'postcode',
    'uprn',
    'source'
  ])
});

/**
 * @note the water company API currently accepts companyId rather than id
 * as it should
 */
const mapCompanyToWaterApi = company =>
  company === null ? null : {
    ...company.id && { companyId: company.id },
    ...pick(company, [
      'type',
      'name',
      'companyNumber',
      'organisationType'
    ])
  };

const mapContactToWaterApi = contact =>
  contact === null ? null : {
    ...contact.id && { contactId: contact.id },
    ...pick(contact, [
      'type',
      'title',
      'firstName',
      'initials',
      'middleInitials',
      'lastName',
      'suffix',
      'department',
      'source',
      'isTest'
    ])
  };

const mapSessionDataToWaterApi = ({ regionId, startDate, data }) => ({
  regionId,
  startDate,
  agent: mapCompanyToWaterApi(data.agentCompany),
  contact: mapContactToWaterApi(data.contact),
  address: mapAddressToWaterApi(data.address)
});

exports.mapSessionDataToWaterApi = mapSessionDataToWaterApi;
