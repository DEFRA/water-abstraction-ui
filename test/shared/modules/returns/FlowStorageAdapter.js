const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { omit } = require('lodash');
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const FlowStorageAdapter = require('shared/modules/returns/FlowStorageAdapter');
const WaterReturn = require('shared/modules/returns/models/WaterReturn');

const returnId = 'v1:1:01/234:1234:2019-11-01:2020-10-31';

const createRequest = () => ({
  query: {
    returnId
  },
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub(),
    clear: sandbox.stub()
  }
});

const createReturn = () => ({
  returnId,
  frequency: 'month',
  meters: [],
  metadata: {}
});

experiment('Returns FlowStorageAdapter:', () => {
  let adapter, mockWaterConnector, request, ret;

  beforeEach(async () => {
    ret = createReturn();
    request = createRequest();
    request.yar.get.returns(ret);
    mockWaterConnector = {
      getReturn: sandbox.stub().resolves(ret),
      postReturn: sandbox.stub()
    };
    adapter = new FlowStorageAdapter(mockWaterConnector);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('get', () => {
    test('loads data from session using correct key', async () => {
      await adapter.get(request);
      expect(mockWaterConnector.getReturn.callCount).to.equal(0);
      expect(request.yar.get.calledWith(
        `return_${returnId}`
      )).to.equal(true);
    });

    test('loads data from water service if session data empty', async () => {
      request.yar.get.returns();
      await adapter.get(request);
      expect(
        mockWaterConnector.getReturn.calledWith(returnId)
      ).to.equal(true);
    });

    test('returns a new WaterReturn model', async () => {
      const result = await adapter.get(request);
      expect(result instanceof WaterReturn).to.equal(true);
    });
  });

  experiment('set', () => {
    test('sets serialised data from WaterReturn in session', async () => {
      const model = await adapter.get(request);
      await adapter.set(request, model);
      expect(request.yar.set.calledWith(
        `return_${returnId}`, model.toObject()
      )).to.equal(true);
    });
  });

  experiment('submit', () => {
    let model;

    beforeEach(async () => {
      model = await adapter.get(request);
      await adapter.submit(request, model);
    });
    test('submits serialised data from WaterReturn to water service omitting versions', async () => {
      const data = omit(model.toObject(), 'versions');
      expect(
        mockWaterConnector.postReturn.calledWith(data)
      ).to.equal(true);
    });

    test('clears session data', async () => {
      expect(
        request.yar.clear.calledWith(`return_${returnId}`)
      ).to.equal(true);
    });
  });
});
