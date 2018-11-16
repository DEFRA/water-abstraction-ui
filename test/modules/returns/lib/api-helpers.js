'use strict';
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

const {
  findLatestReturn
} = require('../../../../src/modules/returns/lib/api-helpers');

experiment('findLatestReturn', () => {
  const result = findLatestReturn('12345678');

  test('It should get a correct filter object', async () => {
    expect(result.filter).to.equal({
      licence_type: 'abstraction',
      regime: 'water',
      return_requirement: '12345678'
    });
  });

  test('It should get a correct sort object', async () => {
    expect(result.sort).to.equal({
      end_date: -1
    });
  });

  test('It should get a correct pagination object', async () => {
    expect(result.pagination).to.equal({
      page: 1,
      perPage: 1
    });
  });

  test('It should only select the return ID column', async () => {
    expect(result.columns).to.equal(['return_id', 'status']);
  });
});
