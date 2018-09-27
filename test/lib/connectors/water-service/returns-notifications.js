'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const { getPaperFormFilter, buildRequest } = require('../../../../src/lib/connectors/water-service/returns-notifications.js');

const licenceNumbers = ['01/123', '02/456'];

lab.experiment('Test getPaperFormFilter', () => {
  lab.test('It should return valid filter object', async () => {
    const filter = getPaperFormFilter(licenceNumbers, '2018-09-25');
    Code.expect(filter).to.equal({ status: 'due',
      end_date: { '$gt': '2017-09-25' },
      licence_ref: { '$in': licenceNumbers },
      'metadata->>isCurrent': 'true'
    });
  });
});

lab.experiment('Test buildRequest', () => {
  const waterUri = process.env.WATER_URI;
  const jwtToken = process.env.JWT_TOKEN;

  lab.before(async () => {
    process.env.WATER_URI = 'http://example.com';
    process.env.JWT_TOKEN = 'xyz';
  });

  lab.after(async () => {
    process.env.WATER_URI = waterUri;
    process.env.JWT_TOKEN = jwtToken;
  });

  lab.test('It should call the preview API when send flag false', async () => {
    const filter = getPaperFormFilter(licenceNumbers, '2018-09-25');
    const request = buildRequest(filter, 'mail@example.com', 'Test notification', 'pdf.test', false);

    Code.expect(request).to.equal({
      'method': 'POST',
      'uri': 'http://example.com/returns-notifications/preview/pdf.test',
      'headers': { Authorization: 'xyz' },
      'body': {
        'filter': {
          'status': 'due',
          'end_date': {
            '$gt': '2017-09-25'
          },
          'licence_ref': {
            '$in': [
              '01/123',
              '02/456'
            ]
          },
          'metadata->>isCurrent': 'true'
        },
        'issuer': 'mail@example.com',
        'name': 'Test notification'
      },
      'json': true
    });
  });

  lab.test('It should call the send API when send flag true', async () => {
    const filter = getPaperFormFilter(licenceNumbers, '2018-09-25');
    const request = buildRequest(filter, 'mail@example.com', 'Test notification', 'pdf.test', true);

    Code.expect(request).to.equal({
      'method': 'POST',
      'uri': 'http://example.com/returns-notifications/send/pdf.test',
      'headers': { Authorization: 'xyz' },
      'body': {
        'filter': {
          'status': 'due',
          'end_date': {
            '$gt': '2017-09-25'
          },
          'licence_ref': {
            '$in': [
              '01/123',
              '02/456'
            ]
          },
          'metadata->>isCurrent': 'true'
        },
        'issuer': 'mail@example.com',
        'name': 'Test notification'
      },
      'json': true
    });
  });
});
