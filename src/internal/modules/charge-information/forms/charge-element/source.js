'use strict';

const routing = require('../../lib/routing');
const Joi = require('@hapi/joi');
const { capitalize } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const { SOURCES } = require('../../lib/charge-elements/constants');

/**
 * Form to request the charge element source
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = routing.getChargeElementStep(licenceId, elementId, 'source');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('source', {
    errors: {
      'any.required': {
        message: 'Select a source'
      }
    },
    choices: SOURCES.map(source => { return { value: source, label: capitalize(source) }; })
  }, sessionData.source || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    source: Joi.string().required().valid(SOURCES)
  };
};

exports.schema = schema;

exports.form = form;
