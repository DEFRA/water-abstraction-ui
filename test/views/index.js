'use strict';

const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const views = require('../../src/views/index.js');

experiment('Page does not exist', () => {
  test('a test', async () => {
    expect(views.engines).to.be.a.object();
  });
});

experiment('Page does not exist', () => {
  test('a test', async () => {
    expect(views.relativeTo).to.be.a.string();
  });
});

experiment('Page does not exist', () => {
  test('a test', async () => {
    expect(views.layoutPath).to.be.a.string();
  });
});

experiment('Page does not exist', () => {
  test('a test', async () => {
    expect(views.layout).to.be.a.string();
  });
});

experiment('Page does not exist', () => {
  test('a test', async () => {
    expect(views.partialsPath).to.be.a.string();
  });
});

experiment('Page does not exist', () => {
  test('a test', async () => {
    expect(views.context).to.be.a.object();
  });
});

experiment('formatTS', () => {
  test('if a valid date is passed in it formats the date to the format D MMMM YYYY', async () => {
    const formatTS = views.engines.html.helpers.formatTS;
    const output = formatTS('2018-01-01');
    expect(output).to.equal('1 January 2018');
  });

  test('if an invalid date is passed in it returns the input', async () => {
    const formatTS = views.engines.html.helpers.formatTS;
    const output = formatTS('not-a-date');
    expect(output).to.equal('not-a-date');
  });
});

experiment('formatSortableDate', () => {
  test('if a valid date is passed in it formats the date to the format D MMMM YYYY', async () => {
    const formatSortableDate = views.engines.html.helpers.formatSortableDate;
    const output = formatSortableDate('20180101');
    expect(output).to.equal('1 January 2018');
  });

  test('if an invalid date is passed in it returns the input', async () => {
    const formatSortableDate = views.engines.html.helpers.formatSortableDate;
    const output = formatSortableDate('not-a-date');
    expect(output).to.equal('not-a-date');
  });
});
