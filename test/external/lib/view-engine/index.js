'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const { difference } = require('lodash');

const viewEngine = require('external/lib/view-engine/index');

lab.experiment('viewEngine', () => {
  lab.test('View engines should be an object', async () => {
    expect(viewEngine.engines).to.be.an.object();
  });

  lab.test('There shoud be Nunjucks view engine', async () => {
    expect(viewEngine.engines.njk).to.be.an.object();
  });

  lab.test('Options should be set on the view engine', async () => {
    const keys = [ 'engines',
      'path',
      'context',
      'isCached'
    ];

    expect(difference(keys, Object.keys(viewEngine))).to.have.length(0);
  });
});
