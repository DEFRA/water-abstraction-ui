'use strict';

const { pick } = require('lodash');

const mapAddressToWaterApi = address => ({
  ...pick(address, [
    'id',
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
    ...pick(company, [
      'id',
      'type',
      'name',
      'companyNumber',
      'organisationType'
    ])
  };

const mapContactToWaterApi = contact =>
  contact === null ? null : {
    ...pick(contact, [
      'id',
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

const mapSessionDataToCreateInvoiceAccount = state => pick(state, ['regionId', 'startDate']);

const mapSessionDataToCreateInvoiceAccountAddress = ({ data }) => ({
  agentCompany: mapCompanyToWaterApi(data.agentCompany),
  contact: mapContactToWaterApi(data.contact),
  address: mapAddressToWaterApi(data.address)
});

exports.mapSessionDataToCreateInvoiceAccount = mapSessionDataToCreateInvoiceAccount;
exports.mapSessionDataToCreateInvoiceAccountAddress = mapSessionDataToCreateInvoiceAccountAddress;
