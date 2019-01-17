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
const config = require('../../../../config');

experiment('getInternalRoles', () => {
  test('returns the original roles if the user is an internal user', async () => {
    const isInternalUser = true;
    const roles = helpers.getInternalRoles(isInternalUser, ['test_role']);
    expect(roles).to.only.include('test_role');
  });

  test('returns replaces the original roles with the expected roles if the user is an external user', async () => {
    const isInternalUser = false;
    const roles = helpers.getInternalRoles(isInternalUser, ['test_role']);
    expect(roles).to.only.include(['primary_user', 'user_returns']);
  });
});

experiment('canEdit', () => {
  const internalUser = {
    returns: {
      read: true,
      edit: true,
      submit: false
    }
  };

  const externalUser = {
    returns: {
      read: true,
      submit: true,
      edit: false
    }
  };

  const pre2018Return = {
    end_date: '2018-10-30',
    status: 'due'
  };

  const post2018Return = {
    end_date: '2018-10-31',
    status: 'due'
  };

  const post2018CompletedReturn = {
    end_date: '2019-03-31',
    status: 'completed'
  };

  test('Internal user cannot edit return if before summer 2018 cycle', async () => {
    expect(helpers.canEdit(internalUser, pre2018Return)).to.equal(false);
  });

  test('Internal user can edit return if after summer 2018 cycle', async () => {
    expect(helpers.canEdit(internalUser, post2018Return)).to.equal(true);
  });

  test('Internal user can edit completed return if after summer 2018 cycle', async () => {
    expect(helpers.canEdit(internalUser, post2018CompletedReturn)).to.equal(true);
  });

  test('External user cannot edit return if before summer 2018 cycle', async () => {
    expect(helpers.canEdit(externalUser, pre2018Return)).to.equal(false);
  });

  test('External user can edit return if after summer 2018 cycle and in the past', async () => {
    expect(helpers.canEdit(externalUser, post2018Return, '2018-10-31')).to.equal(true);
  });

  test('External user can edit return if after summer 2018 cycle', async () => {
    expect(helpers.canEdit(externalUser, post2018Return)).to.equal(true);
  });

  test('External user cannot edit return if after summer 2018 cycle and in the future in production', async () => {
    const testMode = config.testMode;
    const showFutureReturns = config.returns.showFutureReturns;
    config.testMode = false;
    config.returns.showFutureReturns = false;
    expect(helpers.canEdit(externalUser, post2018Return, '2018-10-30')).to.equal(false);
    config.testMode = testMode;
    config.returns.showFutureReturns = showFutureReturns;
  });

  test('External user can edit return if after summer 2018 cycle and in test environments', async () => {
    const testMode = config.testMode;
    const showFutureReturns = config.returns.showFutureReturns;
    config.testMode = true;
    config.returns.showFutureReturns = true;
    expect(helpers.canEdit(externalUser, post2018Return, '2018-10-30')).to.equal(true);
    config.testMode = testMode;
    config.returns.showFutureReturns = showFutureReturns;
  });

  test('External user cannot edit completed returns', async () => {
    expect(helpers.canEdit(externalUser, post2018CompletedReturn, '2018-10-31')).to.equal(false);
  });
});

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

experiment('addFlags', () => {
  test('isReceivedOrInternalVoid = true if return is recieved and completed', async () => {
    const returns = [{ received_date: '2018-01-01', status: 'completed' }];
    const request = {
      permissions: {
        admin: { defra: true },
        returns: { submit: true, edit: true }
      }
    };
    const modified = helpers.addFlags(returns, request);
    expect(modified[0].isReceivedOrInternalVoid).to.be.true();
    expect(modified[0].isClickable).to.be.true();
  });

  test('isReceivedOrInternalVoid = false if return status is due', async () => {
    const returns = [{ status: 'due' }];
    const request = {
      permissions: {
        admin: { defra: true },
        returns: { submit: true, edit: true }
      }
    };
    const modified = helpers.addFlags(returns, request);
    expect(modified[0].isReceivedOrInternalVoid).to.be.false();
  });

  test('isReceivedOrInternalVoid = true if return status is void and user is internal', async () => {
    const returns = [{ status: 'void' }];
    const request = {
      permissions: {
        admin: { defra: true },
        returns: { submit: true, edit: true }
      }
    };
    const modified = helpers.addFlags(returns, request);
    expect(modified[0].isReceivedOrInternalVoid).to.be.true();
    expect(modified[0].isClickable).to.be.true();
  });

  test('isReceivedOrInternalVoid = false if return status is void and user is external', async () => {
    const returns = [{ status: 'void' }];
    const request = {
      permissions: {
        admin: { defra: false },
        returns: { submit: true, edit: true }
      }
    };
    const modified = helpers.addFlags(returns, request);
    expect(modified[0].isReceivedOrInternalVoid).to.be.false();
  });
});
