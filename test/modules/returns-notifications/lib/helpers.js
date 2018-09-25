'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const helpers = require('../../../../src/modules/returns-notifications/lib/helpers');

lab.experiment('return notification helpers', () => {
  lab.test('getUniqueLicenceNumbers returns unique licence numbers from return list', async () => {
    const data = [{
      return_id: 'a',
      licence_ref: '01/123'
    }, {
      return_id: 'b',
      licence_ref: '01/123'
    }, {
      return_id: 'c',
      licence_ref: '04/567'
    }];

    expect(helpers.getUniqueLicenceNumbers(data)).to.equal(['01/123', '04/567']);
  });
});
