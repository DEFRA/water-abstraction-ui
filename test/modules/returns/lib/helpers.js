'use strict';
const moment = require('moment');
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

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
