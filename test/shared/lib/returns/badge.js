'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const badge = require('shared/lib/returns/badge');

experiment('shared/lib/returns/badge', () => {
  experiment('getBadge', () => {
    test('If return is overdue, status is "warning"', async () => {
      expect(badge.getBadge('due', true)).to.equal({
        text: 'Overdue',
        status: 'warning'
      });
    });

    test('If return is due, status is "todo"', async () => {
      expect(badge.getBadge('due', false)).to.equal({
        text: 'Due',
        status: 'todo'
      });
    });

    test('If return is void, status is "inactive"', async () => {
      expect(badge.getBadge('void', false)).to.equal({
        text: 'Void',
        status: 'inactive'
      });
    });

    test('If return is received, status is "success"', async () => {
      expect(badge.getBadge('received', false)).to.equal({
        text: 'Received',
        status: 'success'
      });
    });

    test('If return is completed, status is "success"', async () => {
      expect(badge.getBadge('completed', false)).to.equal({
        text: 'Complete',
        status: 'success'
      });
    });
  });
});
