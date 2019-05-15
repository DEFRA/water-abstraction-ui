'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
const { set } = require('lodash');

const helpers = require('../../../../../src/external/modules/returns-notifications/lib/helpers');

lab.experiment('getUniqueLicenceNumbers', () => {
  lab.test('It should return unique licence numbers from return list', async () => {
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

lab.experiment('getCurrentCycleEndDate', () => {
  lab.test('It should return an ISO date string', async () => {
    expect(helpers.getCurrentCycleEndDate()).to.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
  });

  lab.test('It should return the end of a summer cycle on that date', async () => {
    expect(helpers.getCurrentCycleEndDate('2018-10-31')).to.equal('2018-10-31');
  });

  lab.test('It should return the end of a summer cycle until the next cycle starts', async () => {
    expect(helpers.getCurrentCycleEndDate('2019-03-30')).to.equal('2018-10-31');
  });

  lab.test('It should return the end of a winter cycle on that date', async () => {
    expect(helpers.getCurrentCycleEndDate('2019-03-31')).to.equal('2019-03-31');
  });

  lab.test('It should return the end of a winter cycle until the next cycle starts', async () => {
    expect(helpers.getCurrentCycleEndDate('2019-10-30')).to.equal('2019-03-31');
  });
  lab.test('It should return the end of the following summer cycle when that cycle starts', async () => {
    expect(helpers.getCurrentCycleEndDate('2019-10-31')).to.equal('2019-10-31');
  });
});

lab.experiment('getFinalReminderConfig', () => {
  const request = {};
  set(request, 'auth.credentials.userame', 'mail@example.com');

  lab.test('It should return a cycle date and the current user email address', async () => {
    const result = helpers.getFinalReminderConfig(request);
    expect(result.email).to.equal(request.auth.credentials.username);
    expect(result.endDate).to.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
  });
});
