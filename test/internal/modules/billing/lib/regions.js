const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Regions = require('internal/modules/billing/lib/regions');
const Region = require('internal/modules/billing/lib/region');

experiment('modules/billing/lib/regions', () => {
  experiment('.fromRegions', () => {
    test('creates the expected object', async () => {
      const databaseRegions = [
        { regionId: 'region-id-1', name: 'region-one' },
        { regionId: 'region-id-2', name: 'region-two' }
      ];

      const regions = Regions.fromRegions(databaseRegions);

      expect(regions.regions).to.equal([
        { id: 'region-id-1', name: 'region-one' },
        { id: 'region-id-2', name: 'region-two' }
      ]);
    });
  });

  experiment('.getById', () => {
    test('returns the expected object', async () => {
      const regions = new Regions([
        new Region('region-id-1', 'region-one'),
        new Region('region-id-2', 'region-two')
      ]);

      const region = regions.getById('region-id-1');

      expect(region.id).to.equal('region-id-1');
      expect(region.name).to.equal('region-one');
    });
  });
});
