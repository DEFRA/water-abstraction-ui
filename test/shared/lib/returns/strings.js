'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const strings = require('shared/lib/returns/strings');

experiment('isReturnId', () => {
  const returnId = 'v1:2:MD/123/0045/067:12345678:2013-04-11:2014-03-31';

  test('returns true for a valid return ID', async () => {
    expect(strings.isReturnId(returnId)).to.equal(true);
  });

  test('returns false for other strings', async () => {
    expect(strings.isReturnId('01/1234/56/78')).to.equal(false);
  });
});
