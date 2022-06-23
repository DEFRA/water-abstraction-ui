'use strict'

const returnStatuses = {
  due: 'due',
  completed: 'completed',
  void: 'void',
  received: 'received'
}

const crmRoles = {
  licenceHolder: 'licenceHolder',
  returnsTo: 'returnsTo',
  billing: 'billing',
  additionalContact: 'additionalContact'
}

const transactionStatuses = {
  candidate: 'candidate',
  chargeCreated: 'charge_created',
  approved: 'approved',
  error: 'error'
}

const addressSources = {
  nald: 'nald',
  wrls: 'wrls',
  eaAddressFacade: 'ea-address-facade',
  companiesHouse: 'companies-house'
}

const accountTypes = {
  organisation: 'organisation',
  person: 'person'
}

const organisationTypes = {
  individual: 'individual',
  limitedCompany: 'limitedCompany',
  limitedLiabilityPartnership: 'limitedLiabilityPartnership',
  publicLimitedCompany: 'publicLimitedCompany'
}

exports.returnStatuses = returnStatuses
exports.crmRoles = crmRoles
exports.transactionStatuses = transactionStatuses
exports.addressSources = addressSources
exports.accountTypes = accountTypes
exports.organisationTypes = organisationTypes
