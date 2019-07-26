'use strict';

const { test, experiment } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const {
  getLinesWithReadings
} = require('internal/modules/returns/lib/return-helpers');

experiment('getLinesWithReadings', () => {
  const meter = {
    startReading: 5,
    readings: {
      '2017-10-01_2017-10-31': 10,
      '2017-11-01_2017-11-30': 15,
      '2017-12-01_2017-12-31': null,
      '2018-01-01_2018-01-31': 17
    }
  };

  const lines = [{
    startDate: '2017-10-01',
    endDate: '2017-10-31',
    quantity: 5
  },
  {
    startDate: '2017-11-01',
    endDate: '2017-11-30',
    quantity: 5
  }, {
    startDate: '2017-12-01',
    endDate: '2017-12-31',
    quantity: null
  }, {
    startDate: '2018-01-01',
    endDate: '2018-01-31',
    quantity: 2
  }];

  test('returns lines unchanged if using volumes', async () => {
    const data = {
      reading: {
        method: 'abstractionVolumes'
      },
      meters: [meter],
      lines
    };
    expect(getLinesWithReadings(data)).to.equal(data.lines);
  });

  test('adds meter readings to lines if using one meter', async () => {
    const data = {
      reading: {
        method: 'oneMeter'
      },
      meters: [meter],
      lines
    };
    expect(getLinesWithReadings(data)).to.equal([ { startDate: '2017-10-01',
      endDate: '2017-10-31',
      quantity: 5,
      startReading: 5,
      endReading: 10 },
    { startDate: '2017-11-01',
      endDate: '2017-11-30',
      quantity: 5,
      startReading: 10,
      endReading: 15 },
    { startDate: '2017-12-01',
      endDate: '2017-12-31',
      quantity: null },
    { startDate: '2018-01-01',
      endDate: '2018-01-31',
      quantity: 2,
      startReading: 15,
      endReading: 17 } ]);
  });
});
