const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  createLines, mapMeterLinesToVolumes, getReturnTotal
} = require('shared/modules/returns/models/water-return-helpers');

experiment('water returns helpers:', () => {
  experiment('createLines', () => {
    test('lines are generated if empty', async () => {
      const lines = createLines({
        startDate: '2019-04-01',
        endDate: '2019-05-30',
        frequency: 'month',
        lines: []
      });
      expect(lines).to.equal([
        { startDate: '2019-04-01',
          endDate: '2019-04-30',
          timePeriod: 'month' },
        { startDate: '2019-05-01',
          endDate: '2019-05-31',
          timePeriod: 'month' }
      ]);
    });

    test('lines are not altered if already present', async () => {
      const lines = createLines({
        startDate: '2019-04-01',
        endDate: '2019-05-30',
        frequency: 'month',
        lines: [{
          startDate: '2019-04-01',
          endDate: '2019-04-01',
          timePeriod: 'day'
        }]
      });
      expect(lines).to.equal([{
        startDate: '2019-04-01',
        endDate: '2019-04-01',
        timePeriod: 'day'
      }]);
    });
  });

  experiment('mapMeterLinesToVolumes', async () => {
    const startReading = 10;
    const readings = {
      '2019-04-01_2019-04-30': 12.5,
      '2019-05-01_2019-05-31': 19.82
    };
    const lines = [{
      startDate: '2019-04-01',
      endDate: '2019-04-30',
      timePeriod: 'month'
    }, {
      startDate: '2019-05-01',
      endDate: '2019-05-31',
      timePeriod: 'month'
    }];

    test('should create a volumes array from meter readings', async () => {
      const result = mapMeterLinesToVolumes(startReading, readings, lines);
      expect(result).to.equal([
        { startDate: '2019-04-01',
          endDate: '2019-04-30',
          timePeriod: 'month',
          quantity: 2.5 },
        { startDate: '2019-05-01',
          endDate: '2019-05-31',
          timePeriod: 'month',
          quantity: 7.32 }
      ]);
    });

    test('should multiply volumes if multiplier specified', async () => {
      const result = mapMeterLinesToVolumes(startReading, readings, lines, 10);
      expect(result).to.equal([
        { startDate: '2019-04-01',
          endDate: '2019-04-30',
          timePeriod: 'month',
          quantity: 25 },
        { startDate: '2019-05-01',
          endDate: '2019-05-31',
          timePeriod: 'month',
          quantity: 73.2 }
      ]);
    });

    test('should include readings if flag set', async () => {
      const result = mapMeterLinesToVolumes(startReading, readings, lines, 10, true);
      expect(result).to.equal([
        { startDate: '2019-04-01',
          endDate: '2019-04-30',
          timePeriod: 'month',
          endReading: 12.5,
          quantity: 25 },
        { startDate: '2019-05-01',
          endDate: '2019-05-31',
          timePeriod: 'month',
          endReading: 19.82,
          quantity: 73.2 }
      ]);
    });
  });

  experiment('getReturnTotal', async () => {
    test('returns null if no lines supplied', async () => {
      expect(getReturnTotal()).to.equal(null);
    });

    test('returns sum of volumes from lines, ignoring nulls', async () => {
      const lines = [{
        quantity: null
      }, {
        quantity: 10.5
      }, {
        quantity: 0
      }, {
        quantity: 7
      }];
      expect(getReturnTotal(lines)).to.equal(17.5);
    });
  });
});
