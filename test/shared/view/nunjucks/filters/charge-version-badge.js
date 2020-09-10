const { chargeVersionBadge } = require('shared/view/nunjucks/filters/charge-version-badge');

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

experiment('shared/view/nunjucks/filters/charge-version-badge', () => {
  test('The status text is returned using title casing', async () => {
    const chargeVersion = { status: 'appROVED' };
    const { text } = chargeVersionBadge(chargeVersion);
    expect(text).to.equal('Approved');
  });

  const statuses = [
    { status: 'current', expectedStatus: 'success', expectedText: 'Approved' },
    { status: 'draft', expectedStatus: 'void', expectedText: 'Draft' },
    { status: 'approved', expectedStatus: 'success', expectedText: 'Approved' },
    { status: 'replaced', expectedStatus: 'inactive', expectedText: 'Replaced' },
    { status: 'superseded', expectedStatus: 'inactive', expectedText: 'Replaced' },
    { status: 'invalid', expectedStatus: 'error', expectedText: 'Invalid' },
    { status: 'review', expectedStatus: 'warning', expectedText: 'Review' }
  ];

  statuses.forEach(spec => {
    experiment(`when the charge version status is ${spec.status}`, () => {
      test(`the style is set to ${spec.expectedStatus}`, async () => {
        const chargeVersion = { status: spec.status };
        const { status } = chargeVersionBadge(chargeVersion);
        expect(status).to.equal(spec.expectedStatus);
      });

      test(`the text is set to ${spec.expectedText}`, async () => {
        const chargeVersion = { status: spec.status };
        const { text } = chargeVersionBadge(chargeVersion);
        expect(text).to.equal(spec.expectedText);
      });
    });
  });
});
