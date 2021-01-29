'use strict';

const SessionSlice = require('shared/lib/SessionSlice');

const SESSION_KEY = 'billingAccountEntryPlugin';

module.exports = new SessionSlice(SESSION_KEY);
