'use strict';

const { applicationStateKey } = require('./lib/constants');

const getApplicationSettings = async (request, h) =>
  request.services.water.applicationState.get(applicationStateKey);

exports.getApplicationSettings = getApplicationSettings;
