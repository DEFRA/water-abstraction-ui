'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const {
  titleCase
} = require('shared/view/nunjucks/filters/title-case');

experiment('titleCase Nunjucks filter', () => {
  test('should format lowercase text to title case', async () => {
    const result = titleCase('the very thirsty horse');
    expect(result).to.equal('The Very Thirsty Horse');
  });
});
