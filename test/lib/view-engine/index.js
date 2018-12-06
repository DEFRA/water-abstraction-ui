'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');
const { difference } = require('lodash');

const viewEngine = require('../../../src/lib/view-engine/index.js');

lab.experiment('viewEngine', () => {
  lab.test('View engines should be an object', async () => {
    expect(viewEngine.engines).to.be.an.object();
  });

  lab.test('There shoud be an HTML and a Nunjucks view engine', async () => {
    expect(viewEngine.engines.html).to.be.an.object();
    expect(viewEngine.engines.njk).to.be.an.object();
  });

  lab.test('Options should be set on the view engine', async () => {
    const keys = [ 'engines',
      'path',
      'layoutPath',
      'partialsPath',
      'layout',
      'context',
      'isCached',
      'defaultExtension' ];

    expect(difference(keys, Object.keys(viewEngine))).to.have.length(0);
  });
});
