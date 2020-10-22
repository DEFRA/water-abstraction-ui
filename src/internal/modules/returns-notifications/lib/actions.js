'use strict';
const moment = require('moment');
const { pick, partialRight } = require('lodash');
const DATE_FORMAT = 'YYYY-MM-DD';

const ACTION_TYPES = {
  setInitialState: 'setInitialState',
  setReturnIds: 'setReturnIds',
  setSelectedRole: 'setSelectedRole'
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

exports.ACTION_TYPES = ACTION_TYPES;
exports.setInitialState = setInitialState;
exports.setReturnIds = setReturnIds;
exports.setSelectedRole = setSelectedRole;
