const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { notifyToBadge } = require('../../../../src/internal/modules/notifications-reports/badge-status');

experiment('notifyToBadge', () => {
  test('returns Pending/completed when status is falsey', async () => {
    const result = notifyToBadge();
    expect(result).to.equal({
      text: 'Pending',
      status: 'completed'
    });
  });

  test('returns Pending/completed when status is "sending"', async () => {
    const result = notifyToBadge('sending');
    expect(result).to.equal({
      text: 'Pending',
      status: 'completed'
    });
  });

  test('returns Pending/completed when status is "accepted"', async () => {
    const result = notifyToBadge('accepted');
    expect(result).to.equal({
      text: 'Pending',
      status: 'completed'
    });
  });

  test('returns Sent/completed when status is "received"', async () => {
    const result = notifyToBadge('received');
    expect(result).to.equal({
      text: 'Sent',
      status: 'completed'
    });
  });

  test('returns Sent/completed when status is "delivered"', async () => {
    const result = notifyToBadge('delivered');
    expect(result).to.equal({
      text: 'Sent',
      status: 'completed'
    });
  });

  test('returns Error/error when status is "permanent-failure"', async () => {
    const result = notifyToBadge('permanent-failure');
    expect(result).to.equal({
      text: 'Error',
      status: 'error'
    });
  });

  test('returns Error/error when status is "temporary-failure"', async () => {
    const result = notifyToBadge('temporary-failure');
    expect(result).to.equal({
      text: 'Error',
      status: 'error'
    });
  });

  test('returns Error/error when status is "technical-failure"', async () => {
    const result = notifyToBadge('technical-failure');
    expect(result).to.equal({
      text: 'Error',
      status: 'error'
    });
  });

  test('returns Error/error when status is "error"', async () => {
    const result = notifyToBadge('error');
    expect(result).to.equal({
      text: 'Error',
      status: 'error'
    });
  });
});
