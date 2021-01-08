'use strict';

const { pick } = require('lodash');

const mapAddressToWaterApi = address => ({
  // @todo this endpoint currently accepts addressId rather than id for this model
  addressId: address.id,
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

const mapCompanyToWaterApi = company =>
  company === null ? null : {
    // @todo this endpoint currently accepts companyId rather than id for this model
    companyId: company.id,
    ...pick(company, [
      'type',
      'name',
      'companyNumber',
      'organisationType'
    ])
  };

const mapContactToWaterApi = contact =>
  contact === null ? null : {
    contactId: contact.id,
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
