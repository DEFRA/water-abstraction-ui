'use strict';

module.exports = [
  ...Object.values(require('./billing-accounts')),
  ...Object.values(require('./select-billing-account')),
  ...Object.values(require('./rebilling'))
];
