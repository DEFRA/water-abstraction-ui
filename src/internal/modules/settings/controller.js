'use strict';

const { omit } = require('lodash');

const { handleFormRequest } = require('shared/lib/form-handler');
const forms = require('shared/lib/forms');

const settingsForm = require('./forms/settings');
const { applicationStateKey } = require('./lib/constants');

/**
 * View a page to set application settings
 */
const getSettings = async (request, h) => h.view('nunjucks/form.njk', {
  ...request.view,
  pageTitle: 'Application settings',
  form: handleFormRequest(request, settingsForm)
});

/**
 * Post handler for saving application settings
 */
const postSettings = async (request, h) => {
  const form = handleFormRequest(request, settingsForm);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  // Save new settings
  const data = omit(forms.getValues(form), 'csrf_token');
  await request.services.water.applicationState.set(applicationStateKey, data);

  return h.redirect('/settings');
};

exports.getSettings = getSettings;
exports.postSettings = postSettings;
