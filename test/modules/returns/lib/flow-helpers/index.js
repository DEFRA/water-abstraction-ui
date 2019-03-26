'use strict';
const { expect } = require('code');
const Lab = require('lab');
const sinon = require('sinon');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();

const { createRequest } = require('./test-helpers');

const { getPath, getNextPath, getPreviousPath } =
  require('../../../../../src/modules/returns/lib/flow-helpers');

const internal =
  require('../../../../../src/modules/returns/lib/flow-helpers/internal');

const external =
    require('../../../../../src/modules/returns/lib/flow-helpers/external');

const data = require('./test-data.json');

const path = '/some/path';

const sandbox = sinon.createSandbox();

experiment('Returns flow helpers', () => {
  beforeEach(async () => {
    internal.next.TEST = sandbox.stub();
    internal.previous.TEST = sandbox.stub();
    external.next.TEST = sandbox.stub();
    external.previous.TEST = sandbox.stub();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getPath', () => {
    test('it should return an external path', async () => {
      const request = createRequest(false);
      const result = getPath(path, request, data.nilReturn);
      expect(result).to.equal(`/some/path?returnId=nilReturn`);
    });

    test('it should return an internal path', async () => {
      const request = createRequest(true);
      const result = getPath(path, request, data.nilReturn);
      expect(result).to.equal(`/admin/some/path?returnId=nilReturn`);
    });
  });

  experiment('getNextPath', () => {
    test('it should call an external flow helper for an external user', async () => {
      const request = createRequest(false);
      getNextPath('TEST', request, data.nilReturn);
      expect(external.next.TEST.callCount).to.equal(1);
    });

    test('it should call an external flow helper for an internal user', async () => {
      const request = createRequest(true);
      getNextPath('TEST', request, data.nilReturn);
      expect(internal.next.TEST.callCount).to.equal(1);
    });
  });

  experiment('getPreviousPath', () => {
    test('it should call an external flow helper for an external user', async () => {
      const request = createRequest(false);
      getPreviousPath('TEST', request, data.nilReturn);
      expect(external.previous.TEST.callCount).to.equal(1);
    });

    test('it should call an external flow helper for an internal user', async () => {
      const request = createRequest(true);
      getPreviousPath('TEST', request, data.nilReturn);
      expect(internal.previous.TEST.callCount).to.equal(1);
    });
  });
});
