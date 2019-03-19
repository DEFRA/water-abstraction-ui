'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  titleCase
} = require('../../../../src/lib/view-engine/filters/title-case.js');

lab.experiment('titleCase Nunjucks filter', () => {
  lab.test('should format lowercase text to title case', async () => {
    const result = titleCase('the very thirsty horse');
    expect(result).to.equal('The Very Thirsty Horse');
  });
});
