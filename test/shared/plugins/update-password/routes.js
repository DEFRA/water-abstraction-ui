const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const routes = require('shared/plugins/update-password/routes');

experiment('getConfirmPassword route', () => {
  test('is configured to load user licence count', async () => {
    const updatePasswordRoute = routes.filter(route => route.path === '/update_password');
    const loaderConfig = updatePasswordRoute[0].config.plugins.licenceLoader;
    expect(loaderConfig.loadUserLicenceCount).to.be.true();
  });
});

experiment('postConfirmPassword route', () => {
  test('is configured to load user licence count', async () => {
    const confirmPasswordRoute = routes.filter(route => route.path === '/update_password_verify_password');
    const loaderConfig = confirmPasswordRoute[0].config.plugins.licenceLoader;
    expect(loaderConfig.loadUserLicenceCount).to.be.true();
  });
});

experiment('postSetPassword', () => {
  test('is configured to load user licence count', async () => {
    const setPasswordRoute = routes.filter(route => route.path === '/update_password_verified_password');
    const loaderConfig = setPasswordRoute[0].config.plugins.licenceLoader;
    expect(loaderConfig.loadUserLicenceCount).to.be.true();
  });
});
