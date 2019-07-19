const config = require('./config');
const { create } = require('shared/lib/logger-factory');

exports.logger = create(config);
