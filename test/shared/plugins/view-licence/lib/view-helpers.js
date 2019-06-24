const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { getLicencePageTitle, getCommonViewContext } = require('shared/plugins/view-licence/lib/view-helpers');

experiment('pageTitle', () => {
  test('if licence has custom name, return "Licence number 1234"', async () => {
    const { pageTitle, pageHeading } = getLicencePageTitle('nunjucks/view-licences/contact.njk', '1234', 'customName');
    expect(pageHeading).to.equal('Licence number 1234');
    expect(pageTitle).to.equal('Contact details for customName');
  });

  test('if licence does not have custom name, return title for key', async () => {
    const { pageTitle, pageHeading } = getLicencePageTitle('nunjucks/view-licences/points.njk', '1234');
    expect(pageTitle).to.equal('Abstraction points for 1234');
    expect(pageHeading).to.equal('Abstraction points for licence number 1234');
  });

  test('if licence has custom name and unexpected key, return default response', async () => {
    const { pageTitle, pageHeading } = getLicencePageTitle('nunjucks/view-licences/test', '1234', 'customName');
    expect(pageTitle).to.equal('Licence number 1234');
    expect(pageHeading).to.equal('Licence number 1234');
  });

  test('if licence does not have custom name and unexpected key, return default response', async () => {
    const { pageTitle, pageHeading } = getLicencePageTitle('nunjucks/view-licences/test', '1234');
    expect(pageTitle).to.equal('Licence number 1234');
    expect(pageHeading).to.equal('Licence number 1234');
  });
});

experiment('getCommonViewContext', () => {
  const getRequest = (code1, subCode1, code2, subCode2) => ({
    params: {
      documentId: 'document_1'
    },
    licence: {
      summary: {
        conditions: [{
          code: code1,
          subCode: subCode1,
          otherData: 'should remain',
          test: 1234
        }, {
          code: code2,
          subCode: subCode2,
          otherData: 'should also remain',
          test: 9876
        }]
      }
    }
  });

  experiment('getCommonViewContext', () => {
    test('creates isHof flag for each condition', async () => {
      const result = getCommonViewContext(getRequest('CES', 'LEV', 'CES', 'FLOW'));
      expect(result.summary.conditions[0]).to.include('isHof');
      expect(result.summary.conditions[1]).to.include('isHof');
    });

    test('retains existing condition data', async () => {
      const existingConditionData = ['code', 'subCode', 'otherData', 'test'];
      const result = getCommonViewContext(getRequest('CES', 'LEV', 'CES', 'FLOW'));
      expect(result.summary.conditions[0]).to.include(existingConditionData);
      expect(result.summary.conditions[1]).to.include(existingConditionData);
    });

    experiment('isHof value', () => {
      test('flags are set independently from each other', async () => {
        const result = getCommonViewContext(getRequest('OTHER', 'LEV', 'CES', 'FLOW'));
        expect(result.summary.conditions[0].isHof).to.be.false();
        expect(result.summary.conditions[1].isHof).to.be.true();
      });

      test('is set to false when code !== "CES"', async () => {
        const result = getCommonViewContext(getRequest('OTHER', 'LEV'));
        expect(result.summary.conditions[0].isHof).to.be.false();
      });

      test('is set to false when subCode !== "FLOW" or "LEV"', async () => {
        const result = getCommonViewContext(getRequest('CES', 'OTHER'));
        expect(result.summary.conditions[0].isHof).to.be.false();
      });

      test('is set to true when code !== "CES" subCode !== "FLOW"', async () => {
        const result = getCommonViewContext(getRequest('CES', 'FLOW'));
        expect(result.summary.conditions[0].isHof).to.be.true();
      });

      test('is set to true when code !== "CES" subCode !== "LEV"', async () => {
        const result = getCommonViewContext(getRequest('CES', 'LEV'));
        expect(result.summary.conditions[0].isHof).to.be.true();
      });
    });
  });
});
