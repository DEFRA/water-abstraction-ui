'use strict';

const { returnStatuses } = require('shared/lib/constants');
const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;

const getReturnPurposeString = returnRequirement => {
  const arr = returnRequirement.returnRequirementPurposes.map(returnRequirementPurpose =>
    returnRequirementPurpose.purposeAlias || returnRequirementPurpose.purposeUse.name
  );
  return arr.join(', ');
};

const getDueString = ret => `Due ${isoToReadable(ret.dueDate)}`;
const getReceivedString = ret => `Received ${isoToReadable(ret.receivedDate)}`;

const getReturnStatusString = ret => {
  const actions = {
    [returnStatuses.due]: getDueString,
    [returnStatuses.received]: getReceivedString
  };
  return actions[ret.status](ret);
};

exports.getReturnPurposeString = getReturnPurposeString;
exports.getReturnStatusString = getReturnStatusString;
