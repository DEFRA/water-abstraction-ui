'use strict';

const returnStatuses = {
  due: 'due',
  completed: 'completed',
  void: 'void',
  received: 'received'
};

const crmRoles = {
  licenceHolder: 'licenceHolder',
  returnsTo: 'returnsTo'
};

const transactionStatuses = {
  candidate: 'candidate',
  chargeCreated: 'charge_created',
  approved: 'approved',
  error: 'error'
};

const addressSources = {
  nald: 'nald',
  wrls: 'wrls',
  eaAddressFacade: 'ea-address-facade',
  companiesHouse: 'companies-house'
};

exports.returnStatuses = returnStatuses;
exports.crmRoles = crmRoles;
exports.transactionStatuses = transactionStatuses;
exports.addressSources = addressSources;
