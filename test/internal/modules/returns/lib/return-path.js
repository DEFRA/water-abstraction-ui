'use strict';

const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const {
  getReturnPath,
  isInternalEdit,
  getEditButtonPath
} = require('../../../../../src/internal/modules/returns/lib/return-path');

const { scope } = require('../../../../../src/internal/lib/constants');

const ret = {
  return_id: 'v1:123:456',
  received_date: '2018-11-08',
  status: 'completed',
  end_date: '2018-10-31'
};

const internalView = `/admin/returns/return?id=${ret.return_id}`;
const internalEdit = `/admin/return/internal?returnId=${ret.return_id}`;
const externalView = `/returns/return?id=${ret.return_id}`;
const externalEdit = `/return?returnId=${ret.return_id}`;

const getExternalRequest = (isSubmitter = false) => {
  const scopes = isSubmitter
    ? [scope.external, scope.licenceHolder]
    : [scope.external, scope.colleague];
  return {
    auth: {
      credentials: {
        scope: scopes
      }
    }
  };
};

const getInternalRequest = (isEditor = false) => {
  const scopes = isEditor
    ? [scope.internal, scope.returns]
    : [scope.internal];
  return {
    auth: {
      credentials: {
        scope: scopes
      }
    }
  };
};

experiment('returnPath -  external users', () => {
  test('An external user can view a return if has completed status', async () => {
    const request = getExternalRequest();
    expect(getReturnPath(ret, request)).to.equal({
      path: externalView,
      isEdit: false
    });
  });

  test('An external user cannot view a return if has a due status', async () => {
    const request = getExternalRequest();
    expect(getReturnPath({ ...ret, status: 'due' }, request)).to.equal(undefined);
  });

  test('An external returns user can edit a return if has a due status', async () => {
    const request = getExternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'due' }, request)).to.equal({
      path: externalEdit,
      isEdit: true
    });
  });

  test('An external returns user cannot edit a return if has a void status', async () => {
    const request = getExternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'void' }, request)).to.equal(undefined);
  });

  test('An external returns user cannot edit a return if has a received status', async () => {
    const request = getExternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'received' }, request)).to.equal(undefined);
  });

  test('An external returns user cannot edit a return if the cycle ends in the future', async () => {
    const request = getExternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'received', end_date: '3000-01-01' }, request)).to.equal(undefined);
  });

  test('An external returns user cannot edit a return if the cycle ends before 2018-10-31', async () => {
    const request = getExternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'received', end_date: '2018-10-30' }, request)).to.equal(undefined);
  });
});

experiment('returnPath -  internal users', () => {
  test('An internal user can view a return if has completed status', async () => {
    const request = getInternalRequest();
    expect(getReturnPath(ret, request)).to.equal({
      path: internalView,
      isEdit: false
    });
  });

  test('An internal user can view a return if has void status', async () => {
    const request = getInternalRequest();
    expect(getReturnPath({ ...ret, status: 'void' }, request)).to.equal({
      path: internalView,
      isEdit: false
    });
  });

  test('An internal user cannot edit a return if has due status', async () => {
    const request = getInternalRequest();
    expect(getReturnPath({ ...ret, status: 'due' }, request)).to.equal(undefined);
  });

  test('An internal returns user can edit a return if has due status', async () => {
    const request = getInternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'due' }, request)).to.equal({
      path: internalEdit,
      isEdit: true
    });
  });

  test('An internal returns user can edit a return if has received status', async () => {
    const request = getInternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'received' }, request)).to.equal({
      path: internalEdit,
      isEdit: true
    });
  });

  test('An internal returns user can edit a return if has completed status', async () => {
    const request = getInternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'completed' }, request)).to.equal({
      path: internalView,
      isEdit: false
    });
  });

  test('An internal returns user cannot edit a return if the cycle ends in the future', async () => {
    const request = getInternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'received', end_date: '3000-01-01' }, request)).to.equal(undefined);
  });

  test('An internal returns user cannot edit a return if the cycle ends before 2018-10-31', async () => {
    const request = getInternalRequest(true);
    expect(getReturnPath({ ...ret, status: 'received', end_date: '2018-10-30' }, request)).to.equal(undefined);
  });
});

experiment('Edit Return button - internal users', () => {
  test('An internal user cannot see the edit return button', async () => {
    const request = getInternalRequest();
    expect(getEditButtonPath(ret, request)).to.equal(undefined);
  });

  test('An internal returns user cannot see the edit return button if isInternalEdit is false', async () => {
    const request = getInternalRequest(true);
    expect(getEditButtonPath({ ...ret, status: 'void' }, request)).to.equal(undefined);
  });

  test('An internal returns user can see the edit return button if isInternalEdit is true', async () => {
    const request = getInternalRequest(true);
    expect(getEditButtonPath(ret, request)).to.equal(internalEdit);
  });
});

experiment('isInternalEdit - internal users', () => {
  test('An internal user cannot see the edit return button', async () => {
    const request = getInternalRequest();
    expect(isInternalEdit(ret, request)).to.equal(false);
  });

  test('An internal returns user cannot edit a return if it has void status', async () => {
    const request = getInternalRequest(true);
    expect(isInternalEdit({ ...ret, status: 'void' }, request)).to.equal(false);
  });

  test('An internal returns user cannot edit a return if the end date is before Summer 2018', async () => {
    const request = getInternalRequest(true);
    expect(isInternalEdit({ ...ret, end_date: '2018-10-30' }, request)).to.equal(false);
  });

  test('An internal returns user cannot edit a return if it the end date has not passed', async () => {
    const request = getInternalRequest(true);
    expect(isInternalEdit({ ...ret, end_date: '3000-01-01' }, request)).to.equal(false);
  });

  test('An internal returns user can edit a return if it has completed status', async () => {
    const request = getInternalRequest(true);
    expect(isInternalEdit({ ...ret, status: 'completed' }, request)).to.equal(true);
  });
});
