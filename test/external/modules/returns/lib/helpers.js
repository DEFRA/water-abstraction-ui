'use strict';

const { expect } = require('@hapi/code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { get } = require('lodash');

const services = require('external/lib/connectors/services');
const helpers = require('external/modules/returns/lib/helpers');

experiment('getLicenceReturns', () => {
  beforeEach(async () => {
    sandbox.stub(services.returns.returns, 'findMany').resolves({
      data: {},
      error: null,
      pagination: {}
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('omits void returns for external users', async () => {
    await helpers.getLicenceReturns([], 1, false);
    const filter = services.returns.returns.findMany.args[0][0];
    expect(get(filter, 'status.$ne')).to.equal('void');
  });
});

experiment('isBulkUpload', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('pagination.totalRows > 0', () => {
    beforeEach(async () => {
      sandbox.stub(services.returns.returns, 'findMany').resolves({
        data: {},
        error: null,
        pagination: {
          totalRows: 3
        }
      });
    });

    test('returns true for external XML Upload user', async () => {
      const result = await helpers.isBulkUpload([]);
      expect(result).to.equal(true);
    });
  });

  experiment('filters returns to ensure one or more returns', () => {
    let filter;

    beforeEach(async () => {
      sandbox.stub(services.returns.returns, 'findMany').resolves({
        data: {},
        error: null,
        pagination: {
          totalRows: 3
        }
      });
      await helpers.isBulkUpload(['01/123', '04/567'], '2019-05-05');
      filter = services.returns.returns.findMany.lastCall.args[0];
    });

    test('have the bulk upload flag set', async () => {
      expect(filter['metadata->>isUpload']).to.equal('true');
    });

    test('relate to the current licence version', async () => {
      expect(filter['metadata->>isCurrent']).to.equal('true');
    });

    test('have "due" status', async () => {
      expect(filter.status).to.equal('due');
    });

    test('are in the current return cycle', async () => {
      expect(filter['metadata->>isSummer']).to.equal('false');
      expect(filter.start_date).to.equal({
        $gte: '2018-04-01'
      });
      expect(filter.end_date).to.equal({
        $gte: '2018-10-31',
        $lte: '2019-03-31'
      });
    });

    test(`are for the users' licence numbers`, async () => {
      expect(filter.licence_ref).to.equal({
        $in: ['01/123', '04/567']
      });
    });

    experiment('for a summer return cycle', () => {
      beforeEach(async () => {
        await helpers.isBulkUpload(['01/123', '04/567'], '2019-11-01');
        filter = services.returns.returns.findMany.lastCall.args[0];
      });

      test('are in the current return cycle', async () => {
        expect(filter['metadata->>isSummer']).to.equal('true');
        expect(filter.start_date).to.equal({
          $gte: '2018-11-01'
        });
        expect(filter.end_date).to.equal({
          $gte: '2018-10-31',
          $lte: '2019-10-31'
        });
      });
    });
  });

  experiment('pagination.totalRows === 0', () => {
    beforeEach(async () => {
      sandbox.stub(services.returns.returns, 'findMany').resolves({
        data: {},
        error: null,
        pagination: {
          totalRows: 0
        }
      });
    });

    afterEach(async () => {
      sandbox.restore();
    });
    test('returns false for regular external user', async () => {
      const result = await helpers.isBulkUpload([]);
      expect(result).to.equal(false);
    });
  });
});

experiment('getLicenceNumbers', () => {
  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'findAll').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('requests the required columns', async () => {
    await helpers.getLicenceNumbers({});
    const [, , columns] = services.crm.documents.findAll.lastCall.args;
    expect(columns).to.only.include([
      'system_external_id',
      'document_name',
      'document_id',
      'metadata'
    ]);
  });

  test('does not expired licences for external users', async () => {
    const request = {};
    await helpers.getLicenceNumbers(request);
    const [ filter ] = services.crm.documents.findAll.lastCall.args;
    expect(get(filter, 'includeExpired')).to.be.undefined();
  });
});
