'use strict';

const server = require('../../../index');
const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const sinon = require('sinon');
const client = require('../../../src/lib/connectors/water-service/notifications');

if (process.env.test_mode) {
  lab.experiment('findLastEmail', () => {
    lab.beforeEach(async () => {
      sinon.stub(client, 'getLatestEmailByAddress');
    });

    lab.afterEach(async () => {
      client.getLatestEmailByAddress.restore();
    });

    lab.test('returns a 400 for a missing email', async () => {
      const request = {
        method: 'GET',
        url: '/notifications/last'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    lab.test('returns a 404 if no items are found', async () => {
      client.getLatestEmailByAddress.resolves({
        data: [],
        error: null,
        pagination: { page: 1, perPage: 1, totalRows: 0, pageCount: 0 }
      });

      const request = {
        method: 'GET',
        url: '/notifications/last?email=test'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    lab.test('returns a 200 with the expected data', async () => {
      client.getLatestEmailByAddress.resolves({
        data: [{ id: 1 }, { id: 2 }],
        error: null,
        pagination: { page: 1, perPage: 1, totalRows: 2, pageCount: 1 }
      });

      const request = {
        method: 'GET',
        url: '/notifications/last?email=test'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
      expect(response.result.data[0].id).to.equal(1);
    });
  });
}
