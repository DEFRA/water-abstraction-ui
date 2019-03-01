'use strict';
const moment = require('moment');
const { expect } = require('code');
const Lab = require('lab');
const { beforeEach, afterEach, experiment, test } = exports.lab = Lab.script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { get } = require('lodash');

const returnsConnector = require('../../../../src/lib/connectors/returns').returns;
const helpers = require('../../../../src/modules/returns/lib/helpers');

experiment('isReturnPastDueDate', () => {
  test('is true when the due date is before today', async () => {
    const yesterday = moment().add(-1, 'days').format('YYYY-MM-DD');
    expect(helpers.isReturnPastDueDate({ due_date: yesterday })).to.be.true();
  });

  test('is false when the due date is today', async () => {
    const today = moment().format('YYYY-MM-DD');
    expect(helpers.isReturnPastDueDate({ due_date: today })).to.be.false();
  });

  test('is false when the due date is after today', async () => {
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
    expect(helpers.isReturnPastDueDate({ due_date: tomorrow })).to.be.false();
  });
});

experiment('getRedirectPath', () => {
  const returnId = 'v1:123';
  const formatId = '12345678';

  const ret = {
    return_id: returnId,
    return_requirement: formatId
  };

  test('redirects to view completed return when status is completed', async () => {
    const completed = {
      ...ret,
      status: 'completed'
    };
    expect(helpers.getRedirectPath(completed)).to.equal(`/admin/returns/return?id=${returnId}`);
  });

  test('redirects to edit return when status is not completed', async () => {
    const completed = {
      ...ret,
      status: 'due'
    };
    expect(helpers.getRedirectPath(completed)).to.equal(`/admin/return/internal?returnId=${returnId}`);
  });

  test('redirects to select licence when there is more than 1 matched return', async () => {
    const completed = {
      ...ret,
      status: 'received'
    };
    expect(helpers.getRedirectPath(completed, true)).to.equal(`/admin/returns/select-licence?formatId=${formatId}`);
  });
});

experiment('isReturnId', () => {
  const returnId = 'v1:2:MD/123/0045/067:12345678:2013-04-11:2014-03-31';

  test('returns true for a valid return ID', async () => {
    expect(helpers.isReturnId(returnId)).to.equal(true);
  });

  test('returns false for other strings', async () => {
    expect(helpers.isReturnId('01/1234/56/78')).to.equal(false);
  });
});

experiment('getLicenceReturns', () => {
  beforeEach(async () => {
    sandbox.stub(returnsConnector, 'findMany').resolves({
      data: {},
      error: null,
      pagination: {}
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('does not filter void returns for internal users', async () => {
    await helpers.getLicenceReturns([], 1, true);
    const filter = returnsConnector.findMany.args[0][0];
    expect(get(filter, 'status.$ne')).to.be.undefined();
  });

  test('omits void returns for external users', async () => {
    await helpers.getLicenceReturns([], 1, false);
    const filter = returnsConnector.findMany.args[0][0];
    expect(get(filter, 'status.$ne')).to.equal('void');
  });
});

experiment('getSuffix', () => {
  test('handles superscript', async () => {
    expect(helpers.getSuffix('m³')).to.equal('cubic metres');
    expect(helpers.getSuffix('m3')).to.equal('cubic metres');
  });
});

experiment('getBadge', () => {
  test('If return is overdue, return overdue badge', async () => {
    expect(helpers.getBadge('due', true)).to.equal({
      text: 'Overdue',
      status: 'success'
    });
  });

  test('If return is due, return due badge', async () => {
    expect(helpers.getBadge('due', false)).to.equal({
      text: 'Due',
      status: 'success'
    });
  });

  test('If return is void, return void badge', async () => {
    expect(helpers.getBadge('void', false)).to.equal({
      text: 'Void',
      status: 'void'
    });
  });

  test('If return is received, return received badge', async () => {
    expect(helpers.getBadge('received', false)).to.equal({
      text: 'Received',
      status: 'completed'
    });
  });

  test('If return is completed, return received badge', async () => {
    expect(helpers.getBadge('completed', false)).to.equal({
      text: 'Completed',
      status: 'completed'
    });
  });
});
