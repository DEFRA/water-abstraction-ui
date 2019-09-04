'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  sentenceCase
} = require('shared/view/nunjucks/filters/sentence-case');

experiment('sentenceCase Nunjucks filter', () => {
  test('should format lowercase text to sentence case', async () => {
    const result = sentenceCase('the very thirsty horse');
    expect(result).to.equal('The very thirsty horse');
  });

  test('should format uppercase text to sentence case', async () => {
    const result = sentenceCase('THE VERY THIRSTY HORSE');
    expect(result).to.equal('The very thirsty horse');
  });
});
