const dataService = require('../../../lib/connectors/services');
const Batch = require('../lib/batch');
const Regions = require('../lib/regions');

const getBatch = async batchId => {
  const [batchResponse, regionResponse] = await Promise.all([
    dataService.water.billingBatches.getBatch(batchId),
    dataService.water.regions.getRegions()
  ]);

  const batch = batchResponse.data;
  const regions = regionResponse.data;

  const region = Regions.fromRegions(regions).getById(batch.regionId);
  return new Batch(batchId, batch.dateCreated, batch.batchType)
    .setRegion(region.name);
};

exports.getBatch = getBatch;
