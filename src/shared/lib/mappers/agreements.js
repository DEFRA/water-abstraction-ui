'use strict';

const agreementDescriptions = {
  S127: 'Two-part tariff (S127)',
  S130S: 'Canal and Rivers Trust, supported source (S130S)',
  S130U: 'Canal and Rivers Trust, unsupported source (S130S)'
};

const mapAgreement = agreement => ({
  ...agreement,
  description: agreementDescriptions[agreement.code]
});

exports.agreementDescriptions = agreementDescriptions;
exports.mapAgreement = mapAgreement;
