const batchService = require('./services/batchService');

const loadBatch = async (request, h) => {
  const { batchId } = request.params;
  const batch = await batchService.getBatch(batchId);
  request.defra.batch = batch;
  return h.continue;
};

exports.loadBatch = loadBatch;
