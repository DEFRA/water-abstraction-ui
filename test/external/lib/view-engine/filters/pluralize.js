'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  pluralize
} = require('../../../../../src/external/lib/view-engine/filters/pluralize');

lab.experiment('pluralize Nunjucks filter', () => {
  lab.test('It should pluralize word if given boolean true as second argument', async () => {
    expect(pluralize('point', true)).to.equal('points');
  });

  lab.test('It should not pluralize word if given boolean false as second argument', async () => {
    expect(pluralize('point', false)).to.equal('point');
  });

  lab.test('It should pluralize word if given array with length != 1', async () => {
    expect(pluralize('condition', [])).to.equal('conditions');
    expect(pluralize('condition', ['foo', 'bar'])).to.equal('conditions');
  });

  lab.test('It should not pluralize word if given array with length === 1', async () => {
    expect(pluralize('condition', ['foo'])).to.equal('condition');
  });

  lab.test('It should pluralize word if given boolean true as second argument', async () => {
    expect(pluralize('point', true)).to.equal('points');
  });

  lab.test('It should not pluralize word ending in y', async () => {
    expect(pluralize('daisy', true)).to.equal('daisies');
  });

  lab.test('It should not pluralize mouse', async () => {
    expect(pluralize('mouse', true)).to.equal('mice');
  });
});
