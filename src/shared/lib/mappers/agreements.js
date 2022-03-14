'use strict';

const agreementDescriptions = {
  S127: 'Two-part tariff',
  S130S: 'Canal and Rivers Trust, supported source (S130S)',
  S130U: 'Canal and Rivers Trust, unsupported source (S130U)',
  S126: 'Abatement'
};

const mapAgreement = agreement => ({
  ...agreement,
  description: agreementDescriptions[agreement.code]
});

exports.agreementDescriptions = agreementDescriptions;
exports.mapAgreement = mapAgreement;
