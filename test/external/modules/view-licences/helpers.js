'use strict';

const Lab = require('@hapi/lab');
const { experiment, test } = exports.lab = Lab.script();

const { expect } = require('@hapi/code');

const { mapFilter } = require('../../../../src/external/modules/view-licences/helpers');

experiment('mapFilter', () => {
  test('adds the company entity id to the filter', async () => {
    const filter = mapFilter('1234', {});
    expect(filter.company_entity_id).to.equal('1234');
  });

  test('adds the licence number to the filter if supplied', async () => {
    const filter = mapFilter('1234', { licenceNumber: 'lic-num-123' });
    expect(filter.string).to.equal('lic-num-123');
  });

  test('trims the licence number', async () => {
    let filter = mapFilter('1234', { licenceNumber: '  lic-num-123' });
    expect(filter.string).to.equal('lic-num-123');

    filter = mapFilter('1234', { licenceNumber: '  lic-num-123  ' });
    expect(filter.string).to.equal('lic-num-123');

    filter = mapFilter('1234', { licenceNumber: 'lic-num-123  ' });
    expect(filter.string).to.equal('lic-num-123');
  });

  test('adds the email address to the filter if supplied', async () => {
    const filter = mapFilter('1234', { emailAddress: 'test@example.com' });
    expect(filter.email).to.equal('test@example.com');
  });

  test('trims the email address', async () => {
    let filter = mapFilter('1234', { emailAddress: '  left@example.com' });
    expect(filter.email).to.equal('left@example.com');

    filter = mapFilter('1234', { emailAddress: '  both@example.com  ' });
    expect(filter.email).to.equal('both@example.com');

    filter = mapFilter('1234', { emailAddress: 'right@example.com  ' });
    expect(filter.email).to.equal('right@example.com');
  });
});
