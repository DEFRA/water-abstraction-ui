const Hapi = require('@hapi/hapi');
const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const anonGoogleAnalyticsPlugin = require('../../../../src/internal/lib/hapi-plugins/anon-google-analytics');
const viewContextPlugin = require('../../../../src/internal/lib/hapi-plugins/view-context');

const getTestRoute = (path, pageTitle) => ({
  method: 'GET',
  path,
  handler: () => 'ok',
  options: {
    plugins: {
      viewContext: {
        pageTitle
      }
    }
  }
});

const getServer = async (pluginOptions = {}, pageTitle = '') => {
  const server = Hapi.server();
  await server.register([
    { plugin: viewContextPlugin },
    { plugin: anonGoogleAnalyticsPlugin }
  ]);

  server.route(getTestRoute('/', pageTitle));
  server.route(getTestRoute('/user/{userId}', pageTitle));
  server.route(getTestRoute('/user/{userId}/licence/{licenceNo}', pageTitle));
  return server;
};

experiment('gaUrl', () => {
  test('returns the path when no query string', async () => {
    const server = await getServer();
    const request = { url: '/' };
    const response = await server.inject(request);
    expect(response.request.view.gaUrl).to.equal('/');
  });

  test('returns the path only when there is a query string', async () => {
    const server = await getServer();
    const request = { url: '/?one=1&two=the-number-two' };
    const response = await server.inject(request);
    expect(response.request.view.gaUrl).to.equal('/');
  });

  test('replaces a guid in the path', async () => {
    const server = await getServer();
    const request = { url: '/user/b055587c-0e9a-40bd-a66c-2844ae320be6' };
    const response = await server.inject(request);
    expect(response.request.view.gaUrl).to.equal('/user/_id_');
  });

  test('replaces a multiple guids in the path', async () => {
    const server = await getServer();
    const request = { url: '/user/b055587c-0e9a-40bd-a66c-2844ae320be6/licence/d5d1cbfe-ced2-4f17-b846-a64526800611' };
    const response = await server.inject(request);
    expect(response.request.view.gaUrl).to.equal('/user/_id_/licence/_id_');
  });
});

experiment('gaPageTitle', () => {
  test('returns the original page title when no numbers present', async () => {
    const pageTitle = 'Test - No numbers in this title';
    const server = await getServer({}, pageTitle);
    const request = { url: '/' };
    const response = await server.inject(request);
    expect(response.request.view.gaPageTitle).to.equal(pageTitle);
  });

  test('hashes a page title containing a number', async () => {
    const pageTitle = '1234';
    const server = await getServer({}, pageTitle);
    const request = { url: '/' };
    const response = await server.inject(request);
    expect(response.request.view.gaPageTitle).to.equal('03ac674216f3e15c761e');
  });

  test('hashes a page title containing a word containing a number', async () => {
    const pageTitle = 'hello1234';
    const server = await getServer({}, pageTitle);
    const request = { url: '/' };
    const response = await server.inject(request);
    expect(response.request.view.gaPageTitle).to.equal('d53d8d0632cd64e595b2');
  });

  test('hashes a title containing a potential licence number', async () => {
    const pageTitle = 'Licence Number: 00/00/G*/00';
    const server = await getServer({}, pageTitle);
    const request = { url: '/' };
    const response = await server.inject(request);
    expect(response.request.view.gaPageTitle).to.equal('Licence Number: dc5a282636c5d2624ff5');
  });

  test('hashes a title containing a potential return id', async () => {
    const pageTitle = 'Return: v1:6:00/00:00000800:2017-11-30:2018-10-31';
    const server = await getServer({}, pageTitle);
    const request = { url: '/' };
    const response = await server.inject(request);
    expect(response.request.view.gaPageTitle).to.equal('Return: a39014681b1c7b592da2');
  });
});
