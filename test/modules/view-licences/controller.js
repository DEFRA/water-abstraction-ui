const { expect } = require('code');
const sinon = require('sinon');
const { experiment, test } = exports.lab = require('lab').script();

const controller = require('../../../src/modules/view-licences/controller');

experiment('getLicences', () => {
  test('redirects to security code page if no licences but outstanding verifications', async () => {
    const request = {
      licence: {
        userLicenceCount: 0,
        outstandingVerifications: [{ id: 1 }]
      }
    };

    const h = {
      redirect: sinon.stub().resolves('ok')
    };

    await controller.getLicences(request, h);
    expect(h.redirect.calledWith('/security-code')).to.be.true();
  });

  test('redirects to add licences page if no licences or outstanding verifications', async () => {
    const request = {
      licence: {
        userLicenceCount: 0,
        outstandingVerifications: []
      }
    };

    const h = {
      redirect: sinon.stub().resolves('ok')
    };

    await controller.getLicences(request, h);
    expect(h.redirect.calledWith('/add-licences')).to.be.true();
  });
});
