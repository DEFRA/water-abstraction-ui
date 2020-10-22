'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

const { crmRoles } = require('shared/lib/constants');
const { mapAddressToString } = require('shared/lib/mappers/address');
const { mapCompanyToString } = require('shared/lib/mappers/company');

const mapRoleName = roleName => {
  const roleNames = {
    [crmRoles.licenceHolder]: 'Licence holder',
    [crmRoles.returnsTo]: 'Returns contact'
  };
  return roleNames[roleName];
};

const isLicenceHolderOrReturnsRole = role =>
  [crmRoles.licenceHolder, crmRoles.returnsTo].includes(role.roleName);

const mapRoleLabel = role => `${mapCompanyToString(role.company)}, ${mapAddressToString(role.address)}`;

const mapChoices = document => {
  const roles = document.document.roles
    .filter(isLicenceHolderOrReturnsRole)
    .map(role => ({
      value: role.roleName,
      label: mapRoleLabel(role),
      hint: mapRoleName(role.roleName),
      selected: role.roleName === document.selectedRole
    }));

  roles.push({
    divider: 'Or'
  });

  roles.push({
    label: 'Set up a one time address',
    value: 'createOneTimeAddress'
  });

  return roles;
};

const selectAddressForm = (request, document) => {
  const { csrfToken } = request.view;

  const action = `/returns-notifications/${document.document.id}/select-address`;

  const f = formFactory(action);

  f.fields.push(fields.radio('selectedRole', {
    caption: `Licence ${document.document.licenceNumber}`,
    label: 'Select where to send the form',
    heading: true,
    choices: mapChoices(document)
  }, document.selectedRole));
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
const selectAddressSchema = (request, document) => {
  const validRoleNames = [
    ...document.document.roles.map(role => role.roleName),
    'createOneTimeAddress',
    'oneTimeAddress'
  ];
  return Joi.object({
    csrf_token: Joi.string().guid().required(),
    selectedRole: Joi.string().required().valid(validRoleNames)
  });
};

module.exports.form = selectAddressForm;
module.exports.schema = selectAddressSchema;
