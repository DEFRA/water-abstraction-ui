'use strict';
const moment = require('moment');
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

const setReturnIds = (request, formValues) => {
  const { documentId } = request.params;
  const { returnIds } = formValues;

  return {
    type: ACTION_TYPES.setReturnIds,
    payload: {
      documentId,
      returnIds
    }
  };
};

const setSelectedRole = (request, formValues) => {
  const { documentId } = request.params;
  const { selectedRole } = formValues;

  return {
    type: ACTION_TYPES.setSelectedRole,
    payload: {
      documentId,
      selectedRole
    }
  };
};

exports.ACTION_TYPES = ACTION_TYPES;
exports.setInitialState = setInitialState;
exports.setReturnIds = setReturnIds;
exports.setSelectedRole = setSelectedRole;
