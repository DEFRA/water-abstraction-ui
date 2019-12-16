const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Batch = require('internal/modules/billing/lib/batch');

experiment('internal/modules/billing/lib/batch', () => {
  experiment('.construction', () => {
    test('sets the expected properties', async () => {
      const now = Date.now();
      const batch = new Batch('test-batch-id', now, 'annual');

      expect(batch.id).to.equal('test-batch-id');
      expect(batch.billRunDate).to.equal(now);
      expect(batch.region).to.equal({});
      expect(batch.type).to.equal('annual');
    });
  });

  experiment('.setRegion', () => {
    test('sets the name and id', async () => {
      const batch = new Batch('test-batch-id', Date.now(), 'annual');
      batch.setRegion('South West', 'test-region-id');
      expect(batch.region.name).to.equal('South West');
      expect(batch.region.id).to.equal('test-region-id');
    });
  });
});
