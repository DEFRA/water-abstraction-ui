'use strict';
const moment = require('moment');
const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { beforeEach, afterEach, experiment, test } = exports.lab = Lab.script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { get } = require('lodash');

const services = require('internal/lib/connectors/services');
const helpers = require('internal/modules/returns/lib/helpers');

experiment('isReturnPastDueDate', () => {
  test('is true when the due date is before today', async () => {
    const yesterday = moment().add(-1, 'days').format('YYYY-MM-DD');
    expect(helpers.isReturnPastDueDate({ due_date: yesterday })).to.be.true();
  });

  test('is false when the due date is today', async () => {
    const today = moment().format('YYYY-MM-DD');
    expect(helpers.isReturnPastDueDate({ due_date: today })).to.be.false();
  });

  test('is false when the due date is after today', async () => {
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
    expect(helpers.isReturnPastDueDate({ due_date: tomorrow })).to.be.false();
  });
});

experiment('getRedirectPath', () => {
  const returnId = 'v1:123';
  const formatId = '12345678';

  const ret = {
    return_id: returnId,
    return_requirement: formatId
  };

  test('redirects to view completed return when status is completed', async () => {
    const completed = {
      ...ret,
      status: 'completed'
    };
    expect(helpers.getRedirectPath(completed)).to.equal(`/returns/return?id=${returnId}`);
  });

  test('redirects to edit return when status is not completed', async () => {
    const completed = {
      ...ret,
      status: 'due'
    };
    expect(helpers.getRedirectPath(completed)).to.equal(`/return/internal?returnId=${returnId}`);
  });

  test('redirects to select licence when there is more than 1 matched return', async () => {
    const completed = {
      ...ret,
      status: 'received'
    };
    expect(helpers.getRedirectPath(completed, true)).to.equal(`/returns/select-licence?formatId=${formatId}`);
  });
});

experiment('isReturnId', () => {
  const returnId = 'v1:2:MD/123/0045/067:12345678:2013-04-11:2014-03-31';

  test('returns true for a valid return ID', async () => {
    expect(helpers.isReturnId(returnId)).to.equal(true);
  });

  test('returns false for other strings', async () => {
    expect(helpers.isReturnId('01/1234/56/78')).to.equal(false);
  });
});

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

  test('does not filter void returns for internal users', async () => {
    await helpers.getLicenceReturns([], 1, true);
    const filter = services.returns.returns.findMany.args[0][0];
    expect(get(filter, 'status.$ne')).to.be.undefined();
  });

  test('omits void returns for external users', async () => {
    await helpers.getLicenceReturns([], 1, false);
    const filter = services.returns.returns.findMany.args[0][0];
    expect(get(filter, 'status.$ne')).to.equal('void');
  });
});

experiment('getSuffix', () => {
  test('handles superscript', async () => {
    expect(helpers.getSuffix('m³')).to.equal('cubic metres');
    expect(helpers.getSuffix('m3')).to.equal('cubic metres');
  });
});

experiment('getBadge', () => {
  test('If return is overdue, return overdue badge', async () => {
    expect(helpers.getBadge('due', true)).to.equal({
      text: 'Overdue',
      status: 'success'
    });
  });

  test('If return is due, return due badge', async () => {
    expect(helpers.getBadge('due', false)).to.equal({
      text: 'Due',
      status: 'due'
    });
  });

  test('If return is void, return void badge', async () => {
    expect(helpers.getBadge('void', false)).to.equal({
      text: 'Void',
      status: 'void'
    });
  });

  test('If return is received, return received badge', async () => {
    expect(helpers.getBadge('received', false)).to.equal({
      text: 'Received',
      status: 'completed'
    });
  });

  test('If return is completed, return received badge', async () => {
    expect(helpers.getBadge('completed', false)).to.equal({
      text: 'Completed',
      status: 'completed'
    });
  });
});

experiment('isXmlUpload', () => {
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
      const result = await helpers.isXmlUpload([]);
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
      await helpers.isXmlUpload(['01/123', '04/567'], '2019-05-05');
      filter = services.returns.returns.findMany.lastCall.args[0];
    });

    test('have the GOR upload flag set', async () => {
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
        await helpers.isXmlUpload(['01/123', '04/567'], '2019-11-01');
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
      const result = await helpers.isXmlUpload([]);
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

  test('includes expired licences for internal users', async () => {
    const request = {
      auth: {
        credentials: {
          scope: ['internal']
        }
      }
    };
    await helpers.getLicenceNumbers(request);
    const [ filter ] = services.crm.documents.findAll.lastCall.args;
    expect(get(filter, 'includeExpired')).to.equal(true);
  });
});

experiment('getViewData', () => {
  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'getWaterLicence').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('internal users can see expired documents', async () => {
    const internalRequest = {
      auth: {
        credentials: {
          scope: ['internal']
        }
      }
    };

    const data = { licenceNumber: '123' };

    await helpers.getViewData(internalRequest, data);
    const [licenceNumber, isInternal] = services.crm.documents.getWaterLicence.lastCall.args;

    expect(licenceNumber).to.equal('123');
    expect(isInternal).to.be.true();
  });
});
