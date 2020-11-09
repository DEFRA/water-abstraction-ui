'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

const { crmRoles } = require('shared/lib/constants');
const { mapAddressToString } = require('shared/lib/mappers/address');
const { mapCompanyToString } = require('shared/lib/mappers/company');

const ONE_TIME_ADDRESS_ROLE = 'oneTimeAddress';

const mapRoleHint = role => {
  const roleNames = {
    [crmRoles.licenceHolder]: 'Licence holder',
    [crmRoles.returnsTo]: 'Returns contact',
    [ONE_TIME_ADDRESS_ROLE]: 'One time address'
  };
  return roleNames[role.roleName];
};

const mapRoleLabel = role => `${mapCompanyToString(role.company)}, ${mapAddressToString(role.address)}`;

const isRoleName = (role, ...roleNames) =>
  roleNames.includes(role.roleName);

const mapRole = (role, selectedRole) => ({
  value: role.roleName,
  label: mapRoleLabel(role),
  hint: mapRoleHint(role),
  selected: role.roleName === selectedRole
});

const mapChoices = document => ([
  ...document.document.roles
    .filter(role => isRoleName(role, crmRoles.licenceHolder, crmRoles.returnsTo))
    .map(role => mapRole(role, document.selectedRole)),
  {
    divider: 'Or'
  }, {
    label: 'Set up a one time address',
    value: 'createOneTimeAddress'
  },
  ...document.document.roles
    .filter(role => isRoleName(role, ONE_TIME_ADDRESS_ROLE))
    .map(role => mapRole(role, document.selectedRole))
]);

const selectAddressForm = request => {
  const { document } = request.pre;
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
const selectAddressSchema = request => {
  const { document } = request.pre;
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
