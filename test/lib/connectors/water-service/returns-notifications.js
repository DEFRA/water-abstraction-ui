'use strict';

const {
  experiment,
  test,
  before,
  after,
  beforeEach
} = exports.lab = require('lab').script();

const { expect } = require('code');

const {
  getPaperFormFilter,
  buildRequest,
  getFinalReminderRequestOptions
} = require('../../../../src/lib/connectors/water-service/returns-notifications.js');

const licenceNumbers = ['01/123', '02/456'];

experiment('getPaperFormFilter', () => {
  test('returns a valid filter object with date range current return cycle', async () => {
    const filter = getPaperFormFilter(licenceNumbers, '2019-03-31');
    expect(filter).to.equal({
      status: {
        $in: ['due', 'completed', 'received']
      },
      start_date: { $gte: '2018-04-01' },
      end_date: { $lte: '2019-03-31' },
      licence_ref: { $in: licenceNumbers }
    });
  });
});

experiment('buildRequest', () => {
  const waterUri = process.env.WATER_URI;
  const jwtToken = process.env.JWT_TOKEN;

  before(async () => {
    process.env.WATER_URI = 'http://example.com';
    process.env.JWT_TOKEN = 'xyz';
  });

  after(async () => {
    process.env.WATER_URI = waterUri;
    process.env.JWT_TOKEN = jwtToken;
  });

  test('calls the preview API when send flag false', async () => {
    const filter = getPaperFormFilter(licenceNumbers, '2018-10-31');
    const request = buildRequest(filter, 'mail@example.com', 'Test notification', 'pdf.test', false);

    expect(request).to.equal({
      method: 'POST',
      uri: 'http://example.com/returns-notifications/preview/pdf.test',
      headers: { Authorization: 'xyz' },
      body: {
        filter: {
          status: {
            $in: ['due', 'completed']
          },
          start_date: {
            $gte: '2017-11-01'
          },
          end_date: {
            $lte: '2018-10-31'
          },
          licence_ref: {
            $in: ['01/123', '02/456']
          }
        },
        issuer: 'mail@example.com',
        name: 'Test notification'
      },
      json: true
    });
  });

  test('calls the send API when send flag true', async () => {
    const filter = getPaperFormFilter(licenceNumbers, '2019-10-31');
    const request = buildRequest(filter, 'mail@example.com', 'Test notification', 'pdf.test', true);

    expect(request).to.equal({
      method: 'POST',
      uri: 'http://example.com/returns-notifications/send/pdf.test',
      headers: { Authorization: 'xyz' },
      body: {
        filter: {
          status: {
            $in: ['due', 'completed']
          },
          start_date: {
            $gte: '2018-11-01'
          },
          end_date: {
            $lte: '2019-10-31'
          },
          licence_ref: {
            $in: ['01/123', '02/456']
          }
        },
        issuer: 'mail@example.com',
        name: 'Test notification'
      },
      json: true
    });
  });
});

experiment('getFinalReminderRequestOptions - check endpoint URI', () => {
  test('It should set the preview URI if the isPreview is false', async () => {
    const result = getFinalReminderRequestOptions('2018-01-18', 'mail@example.com', false);
    expect(result.uri.endsWith('/returns-notifications/invite/send')).to.equal(true);
  });

  test('It should set the preview URI if the isPreview is true', async () => {
    const result = getFinalReminderRequestOptions('2018-01-18', 'mail@example.com', true);
    expect(result.uri.endsWith('/returns-notifications/invite/preview?verbose=1')).to.equal(true);
  });
});

experiment('getFinalReminderRequestOptions', () => {
  let result;

  beforeEach(async () => {
    result = getFinalReminderRequestOptions('2018-01-18', 'mail@example.com', false);
  });

  test('It should be a POST request', async () => {
    expect(result.method).to.equal('POST');
  });

  test('It is a JSON request', async () => {
    expect(result.json).to.equal(true);
  });

  test('It should set the send URI if the isPreview argument is false', async () => {
    expect(result.uri.endsWith('/returns-notifications/invite/send')).to.equal(true);
  });

  test('It should set the return end date filter', async () => {
    expect(result.body.filter.end_date).to.equal('2018-01-18');
  });

  test('It should set the return status filter', async () => {
    expect(result.body.filter.status).to.equal('due');
  });

  test('It should send to returns contact if present, defaulting to licence holder', async () => {
    expect(result.body.config.rolePriority).to.equal(['returns_contact', 'licence_holder']);
  });

  test('It should set a prefix for the batch reference number', async () => {
    expect(result.body.config.prefix).to.equal('RFRM-');
  });

  test('It should set the correct issuer email address', async () => {
    expect(result.body.config.issuer).to.equal('mail@example.com');
  });

  test('It should select the correct template', async () => {
    expect(result.body.config.messageRef.default).to.equal('returns_final_reminder');
  });

  test('It should set a name for the notification', async () => {
    expect(result.body.config.name).to.equal('Returns: final reminder');
  });

  test('It should not de-duplicate messages', async () => {
    expect(result.body.config.deDupe).to.equal(false);
  });
});
