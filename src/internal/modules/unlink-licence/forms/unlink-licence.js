const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

/**
 * Creates an object to represent the form for confirming
 * the unlinking of the licence from the CRM entity.
 *
 * @param {Object} request The Hapi request object
 * @param {String} email The user's email address
 */
const form = (request, licenceData) => {
  const { csrfToken } = request.view;

  const f = formFactory(`/licences/${request.params.documentId}/unlink-licence?userId=${request.query.userId}`);

  f.fields.push(fields.checkbox('confirmUnlink', {
    choices: [{
      label: `Yes I want to unlink ${licenceData.licenceNumber} from ${licenceData.companyName}`,
      value: 'confirm'
    }],
    errors: {
      'array.includesRequiredUnknowns': { message: 'Tick the box to confirm you want to unlink this licence' }
    }
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Unlink this licence' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  confirmUnlink: Joi.array().max(1).items(Joi.valid('confirm').required())
};

exports.unlinkLicenceForm = form;
exports.unlinkLicenceSchema = schema;
