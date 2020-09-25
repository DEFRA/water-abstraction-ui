'use strict';

const routing = require('../../lib/routing');
const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const helpers = require('@envage/water-abstraction-helpers');
const { capitalize } = require('lodash');
const { SEASONS } = require('../../lib/charge-elements/constants');

const options = (absPeriod) => {
  const defaultSeason = absPeriod ? helpers.returns.date.getAbstractionPeriodSeason(absPeriod) : '';
  return SEASONS.map(season => {
    const option = { value: season, label: capitalize(season) };
    if (season === defaultSeason) { option.hint = 'This is the default season for the abstraction period set'; };
    return option;
  });
};

/**
 * Form to request the charge element description
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = (request, sessionData = {}) => {
  const { csrfToken } = request.view;
  const { licenceId, elementId } = request.params;
  const action = routing.getChargeElementStep(licenceId, elementId, 'season');
  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('season', {
    errors: {
      'any.required': {
        message: 'Select a season'
      }
    },
    choices: options(sessionData.abstractionPeriod || null)
  }, sessionData.season));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    season: Joi.string().required().valid(SEASONS)
  };
};

exports.schema = schema;

exports.form = form;
