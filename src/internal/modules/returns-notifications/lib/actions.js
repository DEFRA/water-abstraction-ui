'use strict';
const moment = require('moment');
const { pick, partialRight, flatMap, omit } = require('lodash');
const DATE_FORMAT = 'YYYY-MM-DD';

const ACTION_TYPES = {
  setInitialState: 'setInitialState',
  setReturnIds: 'setReturnIds',
  setSelectedRole: 'setSelectedRole',
  setOneTimeAddressName: 'setOneTimeAddressName',
  setOneTimeAddress: 'setOneTimeAddress',
  setLicenceHolders: 'setLicenceHolders'
};

const setInitialState = (request, licences, refDate) => ({
  type: ACTION_TYPES.setInitialState,
  payload: {
    licences,
    refDate: refDate || moment().format(DATE_FORMAT)
  }
});

const createDocumentAction = (request, formValues, type, formKeys) => {
  const payload = {
    documentId: request.params.documentId,
    ...pick(formValues, formKeys)
  };
  return {
    type,
    payload
  };
};

const setReturnIds = partialRight(createDocumentAction, ACTION_TYPES.setReturnIds, ['returnIds']);

const setSelectedRole = partialRight(createDocumentAction, ACTION_TYPES.setSelectedRole, ['selectedRole']);

const setOneTimeAddressName = partialRight(createDocumentAction, ACTION_TYPES.setOneTimeAddressName, ['fullName']);

const setOneTimeAddress = (documentId, address) => ({
  type: ACTION_TYPES.setOneTimeAddress,
  payload: {
    documentId,
    address
  }
});

const setLicenceHolders = (request, formValues) => {
  const documentIds = flatMap(Object.values(omit(formValues, 'csrf_token')));
  return {
    type: ACTION_TYPES.setLicenceHolders,
    payload: {
      documentIds
    }
  };
};

exports.ACTION_TYPES = ACTION_TYPES;
exports.setInitialState = setInitialState;
exports.setReturnIds = setReturnIds;
exports.setSelectedRole = setSelectedRole;
exports.setOneTimeAddressName = setOneTimeAddressName;
exports.setOneTimeAddress = setOneTimeAddress;
exports.setLicenceHolders = setLicenceHolders;
