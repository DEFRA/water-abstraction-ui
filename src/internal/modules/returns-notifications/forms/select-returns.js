'use strict';
const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');
const { returnStatuses } = require('shared/lib/constants');

const getPurposeString = returnRequirement => {
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

const isSelectedReturn = ret => ret.isSelected;
const getReturnId = ret => ret.id;

const getSelectedReturnIds = returns =>
  returns
    .filter(isSelectedReturn)
    .map(getReturnId);

const selectReturnsForm = (request, document) => {
  const { csrfToken } = request.view;

  const action = `/returns-notifications/${document.id}/select-returns`;

  const f = formFactory(action);

  f.fields.push(fields.checkbox('returnIds', {
    caption: `Licence ${document.document.licenceNumber}`,
    label: 'Which returns need a form?',
    heading: true,
    hint: 'Uncheck any returns reference numbers that do not need a form.',
    choices: document.returns.map(ret => ({
      value: ret.id,
      label: `${ret.returnRequirement.legacyId} ${getPurposeString(ret.returnRequirement)}`,
      hint: getReturnStatusString(ret)
    }))
  }, getSelectedReturnIds(document.returns)));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports.form = selectReturnsForm;
