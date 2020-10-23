'use strict';

const Joi = require('@hapi/joi');
const { groupBy, sortBy } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms');
const { crmRoles } = require('shared/lib/constants');
const { mapCompanyToString } = require('shared/lib/mappers/company');

const getLicenceId = document => document.licence.id;

const getLicenceHolderRole = roles =>
  roles.find(role => role.roleName === crmRoles.licenceHolder);

const mapDocumentToChoice = document => {
  const role = getLicenceHolderRole(document.document.roles);

  return {
    value: document.document.id,
    label: mapCompanyToString(role.company),
    hint: role.dateRange.endDate === null && 'Current licence holder'
  };
};

const mapDocumentsToCheckboxField = documents => {
  const { licence } = documents[0];

  const sortedDocuments = sortBy(documents, row => row.document.dateRange.startDate).reverse();
  const value = sortedDocuments.filter(doc => doc.isSelected).map(doc => doc.id);

  return fields.checkbox(`licence_${licence.id}`, {
    label: `Licence ${licence.licenceNumber}`,
    subHeading: true,
    choices: sortedDocuments.map(mapDocumentToChoice)
  }, value);
};

const getDocumentGroups = state => {
  const licenceGroups = groupBy(Object.values(state), getLicenceId);
  return Object.values(licenceGroups)
    .filter(documents => documents.length > 1);
};

const selectLicenceHoldersForm = request => {
  const { csrfToken } = request.view;

  const checkboxFields = getDocumentGroups(request.pre.state)
    .map(mapDocumentsToCheckboxField);

  const f = formFactory(request.path);

  f.fields.push(...checkboxFields);
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
const selectLicenceHoldersSchema = request => {
  const documentGroups = getDocumentGroups(request.pre.state);
  const obj = documentGroups.reduce((acc, documents) => {
    return {
      ...acc,
      [`licence_${documents[0].licence.id}`]: Joi.array().items(Joi.string().guid())
    };
  }, {
    csrf_token: Joi.string().guid().required()
  });
  return Joi.object(obj);
};

module.exports.form = selectLicenceHoldersForm;
module.exports.schema = selectLicenceHoldersSchema;
