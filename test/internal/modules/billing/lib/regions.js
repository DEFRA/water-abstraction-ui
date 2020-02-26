'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Regions = require('internal/modules/billing/lib/regions');
const Region = require('internal/modules/billing/lib/region');

experiment('modules/billing/lib/regions', () => {
  experiment('.fromRegions', () => {
    test('creates the expected object', async () => {
      const databaseRegions = [
        { regionId: 'region-id-1', name: 'region-one', displayName: 'region-one-display' },
        { regionId: 'region-id-2', name: 'region-two', displayName: 'region-two-display' }
      ];

      const regions = Regions.fromRegions(databaseRegions);

      expect(regions.regions).to.equal([
        { id: 'region-id-1', name: 'region-one', displayName: 'region-one-display' },
        { id: 'region-id-2', name: 'region-two', displayName: 'region-two-display' }
      ]);

      expect(regions.regions[0]).to.be.instanceOf(Region);
      expect(regions.regions[1]).to.be.instanceOf(Region);
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
