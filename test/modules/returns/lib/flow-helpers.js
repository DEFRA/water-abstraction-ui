'use strict';
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

const {
  STEP_START, STEP_NIL_RETURN, STEP_METHOD, STEP_UNITS, STEP_SINGLE_TOTAL,
  STEP_BASIS, STEP_QUANTITIES, STEP_METER_DETAILS, STEP_METER_UNITS,
  STEP_METER_READINGS, STEP_CONFIRM, STEP_SUBMITTED,
  getPath, getNextPath, getPreviousPath
} = require('../../../../src/modules/returns/lib/flow-helpers');

const returnId = 'v1:123:456';

const getRequest = (isInternal = false) => {
  return {
    query: {
      returnId
    },
    permissions: {
      hasPermission: () => isInternal
    }
  };
};

experiment('getPath', () => {
  test('Gets the return flow path for an external user', async () => {
    const request = getRequest();
    expect(getPath('/return', request)).to.equal(`/return?returnId=${returnId}`);
  });

  test('Gets the return flow path for an internal user', async () => {
    const request = getRequest(true);
    expect(getPath('/return', request)).to.equal(`/admin/return?returnId=${returnId}`);
  });

  test('Gets the return flow path for an external user with return data supplied', async () => {
    const request = getRequest();
    const data = { returnId };
    expect(getPath('/return', request, data)).to.equal(`/return?returnId=${returnId}`);
  });

  test('Gets the return flow path for an internal user with return data supplied', async () => {
    const request = getRequest(true);
    const data = { returnId };
    expect(getPath('/return', request, data)).to.equal(`/admin/return?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_START', () => {
  const request = getRequest();

  test('Redirects to nil return if no amounts', async () => {
    const data = {
      returnId,
      isNil: true
    };
    expect(getNextPath(STEP_START, request, data)).to.equal(`${STEP_NIL_RETURN}?returnId=${returnId}`);
  });

  test('Redirects to method if amounts', async () => {
    const data = {
      returnId,
      isNil: false
    };
    expect(getNextPath(STEP_START, request, data)).to.equal(`${STEP_METHOD}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_NIL_RETURN', () => {
  const request = getRequest();

  test('Redirects to submitted screen', async () => {
    const data = {
      returnId
    };
    expect(getNextPath(STEP_NIL_RETURN, request, data)).to.equal(`${STEP_SUBMITTED}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_METHOD', () => {
  const request = getRequest();

  test('Redirects to meter details if one meter', async () => {
    const data = {
      returnId,
      reading: {
        method: 'oneMeter'
      }
    };
    expect(getNextPath(STEP_METHOD, request, data)).to.equal(`${STEP_METER_DETAILS}?returnId=${returnId}`);
  });

  test('Redirects to units if volumes', async () => {
    const data = {
      returnId,
      reading: {
        method: 'abstractionVolumes'
      }
    };
    expect(getNextPath(STEP_METHOD, request, data)).to.equal(`${STEP_UNITS}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_UNITS', () => {
  test('Redirects to basis if external user', async () => {
    const request = getRequest();
    const data = {
      returnId
    };
    expect(getNextPath(STEP_UNITS, request, data)).to.equal(`${STEP_BASIS}?returnId=${returnId}`);
  });

  test('Redirects to single total if internal user', async () => {
    const request = getRequest(true);
    const data = {
      returnId
    };
    expect(getNextPath(STEP_UNITS, request, data)).to.equal(`/admin${STEP_SINGLE_TOTAL}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_BASIS', () => {
  const request = getRequest();

  test('Redirects to meter details if measured', async () => {
    const data = {
      returnId,
      reading: {
        type: 'measured'
      }
    };
    expect(getNextPath(STEP_BASIS, request, data)).to.equal(`${STEP_METER_DETAILS}?returnId=${returnId}`);
  });

  test('Redirects to quantities if estimated and not single total', async () => {
    const data = {
      returnId,
      reading: {
        type: 'estimated'
      }
    };
    expect(getNextPath(STEP_BASIS, request, data)).to.equal(`${STEP_QUANTITIES}?returnId=${returnId}`);
  });

  test('Redirects to confirm if estimated and single total', async () => {
    const data = {
      returnId,
      reading: {
        type: 'estimated',
        totalFlag: true
      }
    };
    expect(getNextPath(STEP_BASIS, request, data)).to.equal(`${STEP_CONFIRM}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_QUANTITIES', () => {
  const request = getRequest();

  test('Redirects to confirm', async () => {
    const data = {
      returnId
    };
    expect(getNextPath(STEP_QUANTITIES, request, data)).to.equal(`${STEP_CONFIRM}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_CONFIRM', () => {
  const request = getRequest();

  test('Redirects to submitted', async () => {
    const data = {
      returnId
    };
    expect(getNextPath(STEP_CONFIRM, request, data)).to.equal(`${STEP_SUBMITTED}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_METER_DETAILS', () => {
  const request = getRequest();

  test('Redirects to meter units if meters flow', async () => {
    const data = {
      returnId,
      reading: {
        method: 'oneMeter'
      }
    };
    expect(getNextPath(STEP_METER_DETAILS, request, data)).to.equal(`${STEP_METER_UNITS}?returnId=${returnId}`);
  });

  test('Redirects to quantities if volumes flow', async () => {
    const data = {
      returnId,
      reading: {
        method: 'abstractionVolumes'
      }
    };
    expect(getNextPath(STEP_METER_DETAILS, request, data)).to.equal(`${STEP_QUANTITIES}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_METER_UNITS', () => {
  const request = getRequest();

  test('Redirects to meter readings', async () => {
    const data = {
      returnId
    };
    expect(getNextPath(STEP_METER_UNITS, request, data)).to.equal(`${STEP_METER_READINGS}?returnId=${returnId}`);
  });
});

experiment('getNextPath: STEP_METER_READINGS', () => {
  const request = getRequest();

  test('Redirects to confirm', async () => {
    const data = {
      returnId
    };
    expect(getNextPath(STEP_METER_READINGS, request, data)).to.equal(`${STEP_CONFIRM}?returnId=${returnId}`);
  });
});
