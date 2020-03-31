'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

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
      await controller.getTwoPartTariffViewReady(request, h);
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

  experiment('.getLicenceReview', () => {
    const abstractionPeriods = {
      allYear: {
        startDay: 1,
        startMonth: 1,
        endDay: 31,
        endMonth: 12
      },
      summer: {
        startDay: 1,
        startMonth: 5,
        endDay: 31,
        endMonth: 10
      }
    };

    const purposes = {
      a: {
        code: '400',
        name: 'Watering sunflowers'
      },
      b: {
        code: '401',
        name: 'Washing patios'
      }
    };

    const invoiceLicence = {
      id: uuid(),
      licence: {
        licenceNumber: '01/234/ABC'
      },
      transactions: [{
        id: uuid(),
        twoPartTariffError: 20,
        chargeElement: {
          description: 'Purpose A - borehole A',
          purposeUse: purposes.a,
          abstractionPeriod: abstractionPeriods.allYear
        }
      },
      {
        id: uuid(),
        chargeElement: {
          description: 'Purpose A - borehole B',
          purposeUse: purposes.a,
          abstractionPeriod: abstractionPeriods.allYear
        }
      },
      {
        id: uuid(),
        chargeElement: {
          description: 'Purpose A - borehole c',
          purposeUse: purposes.a,
          abstractionPeriod: abstractionPeriods.summer
        }
      },
      {
        id: uuid(),
        chargeElement: {
          description: 'Purpose B - borehole d',
          purposeUse: purposes.b,
          abstractionPeriod: abstractionPeriods.summer
        }
      }]
    };

    const request = {
      pre: {
        batch: {
          id: uuid()
        }
      },
      params: {
        invoiceLicenceId: uuid()
      },
      view: {
        foo: 'bar'
      }
    };

    beforeEach(async () => {
      sandbox.stub(services.water.billingInvoiceLicences, 'getInvoiceLicence').resolves(invoiceLicence);
      await controller.getLicenceReview(request, h);
    });

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing/two-part-tariff-licence-review');
    });

    test('the invoiceLicence is loaded from the water service', async () => {
      expect(services.water.billingInvoiceLicences.getInvoiceLicence.calledWith(
        request.params.invoiceLicenceId
      )).to.be.true();
    });

    test('the page title is set', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Review returns data issues for 01/234/ABC');
    });

    test('other params on request.view are passed through unchanged', async () => {
      const [, { foo }] = h.view.lastCall.args;
      expect(foo).to.equal('bar');
    });

    test('the batch is set', async () => {
      const [, { batch }] = h.view.lastCall.args;
      expect(batch).to.equal(request.pre.batch);
    });

    test('transactions with same purpose and abstraction period are grouped', async () => {
      const [, { transactionGroups }] = h.view.lastCall.args;
      expect(transactionGroups).to.be.an.array().length(3);

      const groups = transactionGroups.map(group => group.map(tx => tx.chargeElement.description));

      expect(groups[0]).to.only.include(['Purpose A - borehole A', 'Purpose A - borehole B']);
      expect(groups[1]).to.only.include(['Purpose A - borehole c']);
      expect(groups[2]).to.only.include(['Purpose B - borehole d']);
    });

    test('grouped transactions have an edit link', async () => {
      const [, { transactionGroups: [[{ editLink }]] }] = h.view.lastCall.args;
      const expectedLink = [
        `/billing/batch/${request.pre.batch.id}`,
        `/two-part-tariff-licence-review/${invoiceLicence.id}`,
        `/transaction/${invoiceLicence.transactions[0].id}`
      ].join('');
      expect(editLink).to.equal(expectedLink);
    });

    test('grouped transactions have a two-part tariff error message', async () => {
      const [, { transactionGroups: [[{ error }]] }] = h.view.lastCall.args;
      expect(error).to.equal('Under query');
    });

    test('a back link is set', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`/billing/batch/${request.pre.batch.id}/two-part-tariff-review`);
    });

    test('a link to remove the invoice licence from the bill run is set', async () => {
      const [, { removeLink }] = h.view.lastCall.args;
      expect(removeLink).to.equal(`/billing/batch/${request.pre.batch.id}/two-part-tariff-remove-licence/${invoiceLicence.id}`);
    });
  });
});
