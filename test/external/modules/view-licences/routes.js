const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const routes = require('external/modules/view-licences/routes');

experiment('getLicences', () => {
  test('adds config to load the user licence count', async () => {
    const plugins = routes.getLicences.config.plugins;
    expect(plugins.licenceLoader.loadUserLicenceCount).to.be.true();
  });

  test('adds config to load the outstanding verifications', async () => {
    const plugins = routes.getLicences.config.plugins;
    expect(plugins.licenceLoader.loadOutstandingVerifications).to.be.true();
  });
});
