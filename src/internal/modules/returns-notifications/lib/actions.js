'use strict';
const moment = require('moment');
const { pick, partialRight } = require('lodash');
const DATE_FORMAT = 'YYYY-MM-DD';

const ACTION_TYPES = {
  setInitialState: 'setInitialState',
  setReturnIds: 'setReturnIds',
  setSelectedRole: 'setSelectedRole',
  setOneTimeAddressName: 'setOneTimeAddressName',
  setOneTimeAddress: 'setOneTimeAddress'
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

exports.ACTION_TYPES = ACTION_TYPES;
exports.setInitialState = setInitialState;
exports.setReturnIds = setReturnIds;
exports.setSelectedRole = setSelectedRole;
exports.setOneTimeAddressName = setOneTimeAddressName;
exports.setOneTimeAddress = setOneTimeAddress;
