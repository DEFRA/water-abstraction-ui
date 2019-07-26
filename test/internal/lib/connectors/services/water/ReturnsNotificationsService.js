'use strict';

const {
  experiment,
  test,
  afterEach,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { serviceRequest } = require('@envage/water-abstraction-helpers');

const ReturnsNotificationsService = require('internal/lib/connectors/services/water/ReturnsNotificationsService');

experiment('internal/services/ReturnsNotificationsService', () => {
  let service;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post');

    service = new ReturnsNotificationsService('https://example.com/water');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.sendPaperForms', () => {
    let url;
    let options;

    beforeEach(async () => {
      await service.sendPaperForms(['123', '234'], 'issuer@example.com');
      ([url, options] = serviceRequest.post.lastCall.args);
    });

    test('makes a post to the expected url', async () => {
      expect(url).to.equal('https://example.com/water/returns-notifications/send/pdf.return_form');
    });

    test('creates the expected options object', async () => {
      expect(options.body.issuer).to.equal('issuer@example.com');
      expect(options.body.name).to.equal('send paper forms');
    });
  });

  experiment('.previewPaperForms', () => {
    let url;
    let options;

    beforeEach(async () => {
      await service.previewPaperForms(['123', '234'], 'issuer@example.com');
      ([url, options] = serviceRequest.post.lastCall.args);
    });

    test('makes a post to the expected url', async () => {
      expect(url).to.equal('https://example.com/water/returns-notifications/preview/pdf.return_form');
    });

    test('creates the expected options object', async () => {
      expect(options.body.issuer).to.equal('issuer@example.com');
      expect(options.body.name).to.equal('send paper forms');
    });
  });

  experiment('getPaperFormFilter', () => {
    const licenceNumbers = ['12', '234'];

    test('returns a valid filter object with date range current return cycle', async () => {
      const filter = service.getPaperFormFilter(licenceNumbers, '2019-03-31');
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

  experiment('finalReturnReminders', () => {
    let url;
    let options;

    experiment('preview', () => {
      beforeEach(async () => {
        await service.finalReturnReminders('2019-03-31', 'issuer@example.com', true);
        ([url, options] = serviceRequest.post.lastCall.args);
      });

      test('the post is made to the expected URL', async () => {
        expect(url).to.equal('https://example.com/water/returns-notifications/invite/preview?verbose=1');
      });

      test('body data contains the expected filter', async () => {
        expect(options.body.filter).to.equal({
          status: 'due',
          end_date: '2019-03-31',
          'metadata->>isCurrent': 'true'
        });
      });

      test('body data contains the expected config', async () => {
        expect(options.body.config).to.equal({
          rolePriority: ['returns_contact', 'licence_holder'],
          prefix: 'RFRM-',
          issuer: 'issuer@example.com',
          messageRef: {
            default: 'returns_final_reminder'
          },
          name: 'Returns: final reminder',
          deDupe: false
        });
      });
    });

    experiment('send', () => {
      beforeEach(async () => {
        await service.finalReturnReminders('2019-03-31', 'issuer@example.com', false);
        ([url, options] = serviceRequest.post.lastCall.args);
      });

      test('the post is made to the expected URL', async () => {
        expect(url).to.equal('https://example.com/water/returns-notifications/invite/send');
      });

      test('body data contains the expected filter', async () => {
        expect(options.body.filter).to.equal({
          status: 'due',
          end_date: '2019-03-31',
          'metadata->>isCurrent': 'true'
        });
      });

      test('body data contains the expected config', async () => {
        expect(options.body.config).to.equal({
          rolePriority: ['returns_contact', 'licence_holder'],
          prefix: 'RFRM-',
          issuer: 'issuer@example.com',
          messageRef: {
            default: 'returns_final_reminder'
          },
          name: 'Returns: final reminder',
          deDupe: false
        });
      });
    });
  });
});
