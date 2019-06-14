'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');
const querystring = require('querystring');

const { sortQuery } = require('shared/view/nunjucks/filters/sort-query');

experiment('Nunjucks filters: sortQuery', () => {
  test('add the expected params if the field is currently being sorted', async () => {
    const query = {
      direction: 1,
      sort: 'test-field'
    };

    const newQuery = sortQuery(query, 'test-field');
    expect(newQuery).to.equal(querystring.stringify({
      direction: -1,
      sort: 'test-field'
    }));
  });

  test('add the expected params if the field is not being sorted', async () => {
    const query = {
      direction: -1,
      sort: 'test-field'
    };

    const newQuery = sortQuery(query, 'test-field');
    expect(newQuery).to.equal(querystring.stringify({
      direction: 1,
      sort: 'test-field'
    }));
  });

  test('sets the new direction to 1 if the field is not currently being sorted', async () => {
    const query = {
      direction: -1,
      sort: 'test-field'
    };

    const newQuery = sortQuery(query, 'another-field');
    expect(newQuery).to.equal(querystring.stringify({
      direction: 1,
      sort: 'another-field'
    }));
  });
});
