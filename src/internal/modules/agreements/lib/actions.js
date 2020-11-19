'useStrict';

const { pick } = require('lodash');

const ACTION_TYPES = {
  setAgreementType: 'selectAgreementType',
  setDateSigned: 'dateSigned',
  setStartDate: 'checkStartDate'
};

const setAgreementType = (request, formValues) => ({
  type: ACTION_TYPES.setAgreementType,
  payload: pick(formValues, 'financialAgreementCode')
});

const setDateSigned = (request, formValues) => ({
  type: ACTION_TYPES.setDateSigned,
  payload: {
    dateSigned: formValues.dateSigned,
    isDateSignedKnown: formValues.isDateSignedKnown,
    licenceStartDate: request.pre.licence.startDate
  }
});

const setStartDate = (request, formValues) => ({
  type: ACTION_TYPES.setStartDate,
  payload: pick(formValues, ['isCustomStartDate', 'startDate'])
});

exports.ACTION_TYPES = ACTION_TYPES;
exports.setAgreementType = setAgreementType;
exports.setDateSigned = setDateSigned;
exports.setStartDate = setStartDate;
