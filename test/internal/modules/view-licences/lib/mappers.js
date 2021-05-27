const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');

const mappers = require('internal/modules/view-licences/lib/mappers');
const { scope } = require('internal/lib/constants');

experiment('internal/modules/billing/controllers/lib/mappers', () => {
  experiment('.getValidityNotice', () => {
    test('returns message for future-dated licence', async () => {
      const licence = {
        isFutureDated: true,
        startDate: '3000-01-01'
      };
      const notice = mappers.getValidityNotice(licence);
      expect(notice).to.equal('This licence starts on 1 January 3000');
    });

    test('returns message for expired licence in the past', async () => {
      const licence = {
        endDate: '2021-01-01',
        endDateReason: 'expiredDate'
      };
      const notice = mappers.getValidityNotice(licence, '2021-05-01');
      expect(notice).to.equal('This licence expired on 1 January 2021');
    });

    test('returns null for expired licence in the future', async () => {
      const licence = {
        endDate: '2022-01-01',
        endDateReason: 'expiredDate'
      };
      const notice = mappers.getValidityNotice(licence, '2021-05-01');
      expect(notice).to.equal(null);
    });

    test('returns message for lapsed licence in the past', async () => {
      const licence = {
        endDate: '2021-01-01',
        endDateReason: 'lapsedDate'
      };
      const notice = mappers.getValidityNotice(licence, '2021-05-01');
      expect(notice).to.equal('This licence lapsed on 1 January 2021');
    });

    test('returns null for lapsed licence in the future', async () => {
      const licence = {
        endDate: '2022-01-01',
        endDateReason: 'lapsedDate'
      };
      const notice = mappers.getValidityNotice(licence, '2021-05-01');
      expect(notice).to.equal(null);
    });

    test('returns message for revoked licence in the past', async () => {
      const licence = {
        endDate: '2021-01-01',
        endDateReason: 'revokedDate'
      };
      const notice = mappers.getValidityNotice(licence, '2021-05-01');
      expect(notice).to.equal('This licence was revoked on 1 January 2021');
    });

    test('returns null for revoked licence in the future', async () => {
      const licence = {
        endDate: '2022-01-01',
        endDateReason: 'revokedDate'
      };
      const notice = mappers.getValidityNotice(licence, '2021-05-01');
      expect(notice).to.equal(null);
    });
  });

  experiment('.mapChargeVersions', () => {
    const chargeVersions = {
      data: [{
        id: 'test-charge-version-1',
        dateRange: {
          startDate: '2019-01-01'
        }
      }, {
        id: 'test-charge-version-2',
        dateRange: {
          startDate: '2020-01-01'
        },
        versionNumber: 1
      }, {
        id: 'test-charge-version-3',
        dateRange: {
          startDate: '2020-01-01'
        },
        versionNumber: 2
      }]
    };
    const chargeVersionWorkflows = {
      data: [{
        id: 'test-charge-version-workflow-1'
      }]
    };

    experiment('when no charge versions are loaded', () => {
      test('returns null', async () => {
        expect(mappers.mapChargeVersions(null, [])).to.be.null();
      });
    });

    experiment('when charge versions are loaded', () => {
      test('maps the charge versions, sorted by workflows then by data and version number', async () => {
        const result = mappers.mapChargeVersions(chargeVersions, chargeVersionWorkflows);
        const ids = result.map(row => row.id);
        expect(ids).to.equal([
          'test-charge-version-workflow-1',
          'test-charge-version-3',
          'test-charge-version-2',
          'test-charge-version-1'
        ]);
      });
    });
  });

  experiment('.mapAgreements', () => {
    const agreements = [{
      id: uuid(),
      agreement: {
        code: 'S127'
      }
    }];

    test('returns null when licence agreements are null', async () => {
      const result = mappers.mapLicenceAgreements(null);
      expect(result).to.be.null();
    });

    test('returns mapped agreements when licence agreements are an array', async () => {
      const result = mappers.mapLicenceAgreements(agreements);
      expect(result).to.equal([{
        id: agreements[0].id,
        agreement: { code: 'S127', description: 'Two-part tariff (S127)' }
      }]);
    });
  });

  experiment('.mapReturns', () => {
    const returns = {
      data: [{
        id: 'test-return-id-1',
        status: 'due',
        endDate: '2021-03-31'
      }, {
        id: 'test-return-id-2',
        status: 'completed',
        endDate: '2021-03-31'
      }]
    };

    test('returns null when returns are null', async () => {
      const result = mappers.mapReturns(null);
      expect(result).to.be.null();
    });

    test('returns array of mapped returns when returns are not null', async () => {
      const request = {
        auth: {
          credentials: {
            scope: [scope.returns]
          }
        }
      };
      const result = mappers.mapReturns(request, returns);
      expect(result.data).to.equal([
        {
          id: 'test-return-id-1',
          status: 'due',
          endDate: '2021-03-31',
          path: '/return/internal?returnId=test-return-id-1',
          isEdit: true
        },
        {
          id: 'test-return-id-2',
          status: 'completed',
          endDate: '2021-03-31',
          path: '/returns/return?id=test-return-id-2',
          isEdit: false
        }
      ]);
    });
  });
});
