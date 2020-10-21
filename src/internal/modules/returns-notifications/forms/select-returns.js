'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

const { getReturnPurposeString, getReturnStatusString } = require('../lib/return-mapper');

const isSelectedReturn = ret => ret.isSelected;
const getReturnId = ret => ret.id;

const getSelectedReturnIds = returns =>
  returns
    .filter(isSelectedReturn)
    .map(getReturnId);

const selectReturnsForm = (request, document) => {
  const { csrfToken } = request.view;

  const f = formFactory(request.path);

  f.fields.push(fields.checkbox('returnIds', {
    caption: `Licence ${document.document.licenceNumber}`,
    label: 'Which returns need a form?',
    heading: true,
    hint: 'Uncheck any returns reference numbers that do not need a form.',
    choices: document.returns.map(ret => ({
      value: ret.id,
      label: `${ret.returnRequirement.legacyId} ${getReturnPurposeString(ret.returnRequirement)}`,
      hint: getReturnStatusString(ret)
    }))
  }, getSelectedReturnIds(document.returns)));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

/**
 * Gets Joi schema for "select returns" form
 * @param {Object} request - hapi request
 * @param {Object} document - the currently selected CRM v2 document
 * @return {Object} Joi schema
 */
const selectReturnsSchema = (request, document) => {
  const validReturnIds = document.returns.map(getReturnId);
  return Joi.object({
    csrf_token: Joi.string().guid().required(),
    returnIds: Joi.array().required().items(Joi.string().valid(validReturnIds))
  });
};

module.exports.form = selectReturnsForm;
module.exports.schema = selectReturnsSchema;
