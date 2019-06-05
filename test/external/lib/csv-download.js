'use strict';

const sinon = require('sinon');
const Lab = require('lab');
const { experiment, test, beforeEach } = exports.lab = Lab.script();
const { expect } = require('code');

const { csvDownload } = require('../../../src/external/lib/csv-download');

experiment('csvDownload', () => {
  let header;
  let h;

  beforeEach(async () => {
    header = sinon.stub().returnsThis();
    h = {
      response: sinon.stub().returns({
        header
      })
    };
  });

  const data = [{ name: 'John', age: 25 }, { name: 'Jane', age: 36 }];

  test('It should create a HAPI response to download data as CSV', async () => {
    await csvDownload(h, data, 'test.csv');
    expect(h.response.firstCall.args).to.equal([ 'name,age\nJohn,25\nJane,36\n' ]);
    expect(header.firstCall.args).to.equal([ 'Content-type', 'text/csv' ]);
    expect(header.secondCall.args).to.equal([ 'Content-disposition', 'attachment; filename=test.csv' ]);
  });

  test('It should create a HAPI response with default filename of download.csv if none specified', async () => {
    await csvDownload(h, data);
    expect(header.secondCall.args).to.equal([ 'Content-disposition', 'attachment; filename=download.csv' ]);
  });
});
