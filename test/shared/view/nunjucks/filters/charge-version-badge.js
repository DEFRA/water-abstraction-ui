const { chargeVersionBadge } = require('shared/view/nunjucks/filters/charge-version-badge');

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

experiment('shared/view/nunjucks/filters/charge-version-badge', () => {
  test('The status text is returned using title casing', async () => {
    const chargeVersion = { status: 'titleCasePlease' };
    const { text } = chargeVersionBadge(chargeVersion);
    expect(text).to.equal('Title Case Please');
  });

  experiment('for a status of current', () => {
    test('the style is set to "completed"', async () => {
      const chargeVersion = { status: 'current' };
      const { status } = chargeVersionBadge(chargeVersion);
      expect(status).to.equal('completed');
    });

    test('the text is set to "Current"', async () => {
      const chargeVersion = { status: 'current' };
      const { text } = chargeVersionBadge(chargeVersion);
      expect(text).to.equal('Current');
    });
  });

  experiment('for a status of draft', () => {
    test('the style is set to "void"', async () => {
      const chargeVersion = { status: 'draft' };
      const { status } = chargeVersionBadge(chargeVersion);
      expect(status).to.equal('void');
    });

    test('the text is set to "Draft"', async () => {
      const chargeVersion = { status: 'draft' };
      const { text } = chargeVersionBadge(chargeVersion);
      expect(text).to.equal('Draft');
    });
  });
});
