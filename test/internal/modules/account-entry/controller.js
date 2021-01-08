'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');

const uuid = require('uuid/v4');

const sandbox = sinon.createSandbox();

const controller = require('../../../../src/internal/modules/account-entry/controller');
const ADDRESS_FLOW_SESSION_KEY = require('../../../../src/internal/modules/address-entry/plugin').SESSION_KEY;

// let contactId = uuid();
// let companyId = uuid();
// let regionId = uuid();
// let back = '/some/return/url';
// let redirectPath = '/some/other/url';

experiment('internal/modules/account-entry/controller', () => {

});
