const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');

const mappers = require('internal/modules/view-licences/lib/mappers');

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
    const licenceId = 'test-licence-id';

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
        expect(mappers.mapChargeVersions(null, [], { licenceId })).to.be.null();
      });
    });

    experiment('when charge versions are loaded', () => {
      test('maps the charge versions, sorted by workflows then by data and version number', async () => {
        const result = mappers.mapChargeVersions(chargeVersions, chargeVersionWorkflows, { licenceId });
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
    let agreements, options;

    const licenceId = uuid();
    const licenceAgreementId = uuid();

    beforeEach(() => {
      agreements = [{
        id: licenceAgreementId,
        agreement: {
          code: 'S127'
        },
        dateRange: {
          startDate: '2020-01-01',
          endDate: null
        }
      }];

      options = {
        manageAgreements: true,
        licenceId
      };
    });

    test('returns null when licence agreements are null', async () => {
      const result = mappers.mapLicenceAgreements(null, options);
      expect(result).to.be.null();
    });

    test('returns mapped agreements when licence agreements are an array', async () => {
      const result = mappers.mapLicenceAgreements(agreements, options);
      expect(result).to.be.an.array().length(1);
      expect(result[0].id).to.equal(agreements[0].id);
      expect(result[0].agreement).to.equal({ code: 'S127', description: 'Two-part tariff (S127)' });
    });

    test('includes action links', async () => {
      const [{ links }] = mappers.mapLicenceAgreements(agreements, options);
      expect(links).to.equal([
        {
          text: 'Delete',
          path: `/licences/${licenceId}/agreements/${licenceAgreementId}/delete`
        },
        {
          text: 'End',
          path: `/licences/${licenceId}/agreements/${licenceAgreementId}/end`
        }
      ]);
    });

    test('does not include and "end" action link if the agreement has ended', async () => {
      agreements[0].dateRange.endDate = '2021-01-01';
      const [{ links }] = mappers.mapLicenceAgreements(agreements, options);
      expect(links).to.equal([
        {
          text: 'Delete',
          path: `/licences/${licenceId}/agreements/${licenceAgreementId}/delete`
        }
      ]);
    });

    test('does not include action links if the user does not have permission to view', async () => {
      options.manageAgreements = false;
      const [{ links }] = mappers.mapLicenceAgreements(agreements, options);
      expect(links).to.equal([]);
    });
  });
});
