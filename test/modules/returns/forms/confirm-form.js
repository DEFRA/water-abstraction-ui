const { find } = require('lodash');
const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const confirmForm = require('../../../../src/modules/returns/forms/confirm');
const { scope } = require('../../../../src/lib/constants');

const { convertHandlerToApply } = require('../test-helpers');
const controller = require('../../../../src/modules/returns/controllers/edit');
const moment = require('moment');

const getRequest = (isInternal) => {
  return {
    auth: {
      credentials: {
        scope: [isInternal ? scope.internal : scope.external]
      }
    },
    view: {
      csrfToken: 'xyz'
    },
    query: {
      returnId: 'abc'
    }
  };
};

experiment('confirmForm', () => {
  const externalForm = confirmForm(getRequest(false), {});
  const internalForm = confirmForm(getRequest(true), {});

  test('it should have an external action URL for external users', async () => {
    expect(externalForm.action).to.equal('/return/nil-return?returnId=abc');
  });

  test('it should have a CSRF token', async () => {
    const csrf = find(externalForm.fields, { name: 'csrf_token' });
    expect(csrf.value).to.equal('xyz');
  });

  test('it should have an internal action URL for internal users', async () => {
    expect(internalForm.action).to.equal('/admin/return/nil-return?returnId=abc');
  });

  test('it should not include under query checkbox for external users', async () => {
    const fieldNames = externalForm.fields.map(field => field.name);
    expect(fieldNames).to.equal(['csrf_token', null]);
  });

  test('it should include under query checkbox for internal users', async () => {
    const fieldNames = internalForm.fields.map(field => field.name);
    expect(fieldNames).to.equal(['csrf_token', 'isUnderQuery', null]);
  });

  test('it should not be checked if isUnderQuery flag is false', async () => {
    const request = getRequest(true);
    const form = confirmForm(request, { isUnderQuery: false });
    const checkbox = find(form.fields, { name: 'isUnderQuery' });
    expect(checkbox.value).to.equal([]);
  });

  test('it should be checked if isUnderQuery flag is true', async () => {
    const request = getRequest(true);
    const form = confirmForm(request, { isUnderQuery: true });
    const checkbox = find(form.fields, { name: 'isUnderQuery' });
    expect(checkbox.value).to.equal(['under_query']);
  });
});

experiment('applyConfirm', () => {
  const returnModel = {
    returnId: 'test',
    reading: {
      type: 'measured'
    },
    meters: [{
      manufacturer: 'Very accurate'
    }]
  };
  const formData = {};

  experiment('for external users', () => {
    const apply = convertHandlerToApply(controller.postConfirm);

    test('sets status to "completed"', async () => {
      const result = await apply(returnModel, formData);
      expect(result.status).to.equal('completed');
    });

    test('sets received date to today', async () => {
      const today = moment().format('YYYY-MM-DD');
      const result = await apply(returnModel, formData);
      expect(result.receivedDate).to.equal(today);
    });

    test('passes through meters array when reading type is measured', async () => {
      const result = await apply(returnModel, formData);
      expect(result.meters).to.equal(returnModel.meters);
    });

    test('resets meters to empty array when reading type is estimated', async () => {
      const ret = {
        ...returnModel,
        reading: {
          type: 'estimated'
        }
      };
      const result = await apply(ret, formData);
      expect(result.meters).to.equal([]);
    });

    test('does not set under query flag', async () => {
      const result = await apply(returnModel, { isUnderQuery: 'under_query' });
      expect(result.isUnderQuery).to.be.undefined();
    });
  });

  experiment('for internal users', () => {
    const apply = convertHandlerToApply(controller.postConfirm, true);

    test('sets under query flag', async () => {
      const result = await apply(returnModel, { isUnderQuery: 'under_query' });
      expect(result.isUnderQuery).to.equal(true);
    });

    test('clears under query flag', async () => {
      const ret = {
        ...returnModel,
        isUnderQuery: true
      };
      const result = await apply(ret, formData);
      expect(result.isUnderQuery).to.equal(false);
    });
  });
});
