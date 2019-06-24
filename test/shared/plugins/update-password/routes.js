const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const routes = require('shared/plugins/update-password/routes');

experiment('getCurrentPassword', () => {
  test('is configured to load user licence count', async () => {
    console.log(routes.getCurrentPassword);
    const loaderConfig = routes.getCurrentPassword.config.plugins.licenceLoader;
    expect(loaderConfig.loadUserLicenceCount).to.be.true();
  });
});

experiment('postCurrentPassword', () => {
  test('is configured to load user licence count', async () => {
    const loaderConfig = routes.postCurrentPassword.config.plugins.licenceLoader;
    expect(loaderConfig.loadUserLicenceCount).to.be.true();
  });
});

experiment('postNewPassword', () => {
  test('is configured to load user licence count', async () => {
    const loaderConfig = routes.postNewPassword.config.plugins.licenceLoader;
    expect(loaderConfig.loadUserLicenceCount).to.be.true();
  });
});
