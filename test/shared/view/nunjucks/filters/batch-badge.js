'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { batchBadge } = require('shared/view/nunjucks/filters/batch-badge');

experiment('batchBadge Nunjucks filter', () => {
  let badge;
  experiment('when batch status is "processing"', () => {
    beforeEach(async () => {
      badge = batchBadge({ status: 'processing' });
    });

    test('badge text is "Building', async () => {
      expect(badge.text).to.equal('Building');
    });

    test('badge status is warning', async () => {
      expect(badge.status).to.equal('warning');
    });

    test('badge is not large', async () => {
      expect(badge.isLarge).to.be.undefined();
    });
  });

  experiment('when batch status is "ready"', () => {
    beforeEach(async () => {
      badge = batchBadge({ status: 'ready' });
    });

    test('badge text is "Ready"', async () => {
      expect(badge.text).to.equal('Ready');
    });

    test('badge status is success', async () => {
      expect(badge.status).to.equal('success');
    });

    test('badge is not large', async () => {
      expect(badge.isLarge).to.be.undefined();
    });
  });

  experiment('when batch status is "sent"', () => {
    beforeEach(async () => {
      badge = batchBadge({ status: 'sent' });
    });

    test('badge text is "Sent"', async () => {
      expect(badge.text).to.equal('Sent');
    });

    test('badge status is default', async () => {
      expect(badge.status).to.be.undefined();
    });

    test('badge is not large', async () => {
      expect(badge.isLarge).to.be.undefined();
    });
  });

  experiment('when batch status is "review"', () => {
    beforeEach(async () => {
      badge = batchBadge({ status: 'review' });
    });

    test('badge text is "Review"', async () => {
      expect(badge.text).to.equal('Review');
    });

    test('badge status is warning', async () => {
      expect(badge.status).to.equal('success');
    });

    test('badge is not large', async () => {
      expect(badge.isLarge).to.be.undefined();
    });
  });

  experiment('when batch status is "error"', () => {
    beforeEach(async () => {
      badge = batchBadge({ status: 'error' });
    });

    test('badge text is "Error"', async () => {
      expect(badge.text).to.equal('Error');
    });

    test('badge status is error', async () => {
      expect(badge.status).to.equal('error');
    });

    test('badge is not large', async () => {
      expect(badge.isLarge).to.be.undefined();
    });
  });

  experiment('when the second argument is true', () => {
    beforeEach(async () => {
      badge = batchBadge({ status: 'error' }, true);
    });

    test('badge is large', async () => {
      expect(badge.size).to.equal('large');
    });
  });
});
