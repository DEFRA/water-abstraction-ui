'use strict';

const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

const { expect } = require('code');

const { isMany, mapErrors, licenceValidator } = require('../../../../../src/internal/modules/notifications/lib/licence-validator');

// Data returned from CRM
const data = [{
  system_external_id: '01/123'
}, {
  system_external_id: '04/567'
}];

experiment('isMany', () => {
  test('It should return false if array length is 1 or less', async () => {
    expect(isMany(['foo'])).to.equal(false);
  });
  test('It should return true if array length is 2 or more', async () => {
    expect(isMany(['foo', 'bar'])).to.equal(true);
  });
});

experiment('mapErrors', () => {
  test('It should return an empty array if supplied an empty array', async () => {
    expect(mapErrors([])).to.equal([]);
  });

  test('It should return an error if supplied a single licence number', async () => {
    const errors = mapErrors(['01/234']);
    expect(errors).to.equal([ { message: 'Licence number 01/234 could not be found' } ]);
  });

  test('It should return a plural error if supplied multiple licence numbers', async () => {
    const errors = mapErrors(['01/234', '56/789']);
    expect(errors).to.equal([ { message: 'Licence numbers 01/234, 56/789 could not be found' } ]);
  });
});

experiment('licenceValidator', () => {
  test('It should not return an error if all the requested licences were found', async () => {
    const filter = {
      system_external_id: {
        $in: ['01/123', '04/567']
      }
    };
    const errors = licenceValidator(filter, data);
    expect(errors).to.equal([]);
  });

  test('It should return an error if not all the requested licences were found', async () => {
    const filter = {
      system_external_id: {
        $in: ['01/123', '04/567', '08/910']
      }
    };
    const errors = licenceValidator(filter, data);
    expect(errors.length).to.equal(1);
  });
});
