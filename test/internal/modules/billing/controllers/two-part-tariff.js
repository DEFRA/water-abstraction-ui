'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/billing/controllers/two-part-tariff');

const batchData = {
  id: 'test-batch-id',
  dateCreated: '2000-01-01T00:00:00.000Z',
  type: 'two-part-tariff',
  region: {
    id: 'test-region-1',
    name: 'Anglian',
    code: 'A'
  }
};

const batchLicences = [
  {
    licenceRef: 'test-licence-ref-1',
    licenceId: 'test-licence-id-1',
    licenceHolder: {
      id: 'licence-holder-2',
      initials: 'F S',
      lastName: 'surname',
      firstName: 'forename',
      salutation: null
    },
    twoPartTariffStatuses: [10, 20, 30]
  },
  {
    licenceRef: 'test-licence-ref-2',
    licenceId: 'test-licence-id-2',
    licenceHolder: {
      id: 'licence-holder-2',
      initials: 'A B',
      lastName: 'Last',
      firstName: 'First',
      salutation: null
    },
    twoPartTariffStatuses: [10]
  },
  {
    licenceRef: 'test-licence-ref-3',
    licenceId: 'test-licence-id-3',
    licenceHolder: {
      id: 'licence-holder-3'
    },
    twoPartTariffStatuses: []
  }
];
const secondHeader = sandbox.stub();
const header = sandbox.stub().returns({ header: secondHeader });

experiment('internal/modules/billing/controller/two-part-tariff', () => {
  let h, request;
  h = {
    view: sandbox.stub(),
    response: sandbox.stub().returns({ header }),
    redirect: sandbox.stub()
  };

  request = {
    pre: { batch: batchData },
    params: {
      batchId: 'test-batch-id'
    }
  };

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getTwoPartTariffReview', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.billingBatches, 'getBatchLicences').resolves(batchLicences);
      await controller.getTwoPartTariffReview(request, h);
    });

    test('uses the correct view template', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/two-part-tariff-review');
    });

    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1]);
      expect(keys).to.equal(['batch', 'licences', 'totals', 'back']);
    });

    test('returns the correct batch data to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.batch.id).to.equal('test-batch-id');
      expect(view.batch.dateCreated).to.equal('2000-01-01T00:00:00.000Z');
      expect(view.batch.type).to.equal('two-part-tariff');
      expect(view.batch.region.name).to.equal('Anglian');
    });

    test('returns the correct licences to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licences).to.be.array();
      expect(view.licences[0].licenceRef).to.equal('test-licence-ref-1');
      expect(view.licences[0].licenceId).to.equal('test-licence-id-1');
      expect(view.licences[0].licenceHolder).to.be.an.object();
      expect(view.licences[0].licenceHolder.salutation).to.equal(null);
      expect(view.licences[0].licenceHolder.initials).to.equal('F S');
      expect(view.licences[0].licenceHolder.firstName).to.equal('forename');
      expect(view.licences[0].licenceHolder.lastName).to.equal('surname');
      expect(view.licences[0].twoPartTariffStatuses).to.equal('Multiple errors');
      expect(view.licences[1].twoPartTariffStatuses).to.equal('No returns submitted');
      expect(view.licences[2].twoPartTariffStatuses).to.equal(null);
    });

    test('returns the correct totals to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.totals.errors).to.equal(2);
      expect(view.totals.ready).to.equal(1);
      expect(view.totals.total).to.equal(3);
    });

    test('returns the correct back link to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/list');
    });
  });

  experiment('.getTwoPartTariffReady', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.billingBatches, 'getBatchLicences').resolves(batchLicences);
      await controller.getTwoPartTariffReady(request, h);
    });

    test('uses the correct view template', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/two-part-tariff-ready');
    });

    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1]);
      expect(keys).to.equal(['batch', 'licences', 'totals', 'back']);
    });

    test('returns the correct batch data to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.batch.id).to.equal('test-batch-id');
      expect(view.batch.dateCreated).to.equal('2000-01-01T00:00:00.000Z');
      expect(view.batch.type).to.equal('two-part-tariff');
      expect(view.batch.region.name).to.equal('Anglian');
    });

    test('returns the correct licences to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licences).to.be.array();
      expect(view.licences[0].licenceRef).to.equal('test-licence-ref-1');
      expect(view.licences[0].licenceId).to.equal('test-licence-id-1');
      expect(view.licences[0].licenceHolder).to.be.an.object();
      expect(view.licences[0].licenceHolder.salutation).to.equal(null);
      expect(view.licences[0].licenceHolder.initials).to.equal('F S');
      expect(view.licences[0].licenceHolder.firstName).to.equal('forename');
      expect(view.licences[0].licenceHolder.lastName).to.equal('surname');
    });

    test('returns the correct totals to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.totals.errors).to.equal(2);
      expect(view.totals.ready).to.equal(1);
      expect(view.totals.total).to.equal(3);
    });

    test('returns the correct back link to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/list');
    });
  });
});
