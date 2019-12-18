'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const badge = require('shared/lib/returns/badge');

experiment('shared/lib/returns/badge', () => {
  experiment('getBadge', () => {
    test('If return is overdue, return overdue badge', async () => {
      expect(badge.getBadge('due', true)).to.equal({
        text: 'Overdue',
        status: 'error'
      });
    });

    test('If return is due, return due badge', async () => {
      expect(badge.getBadge('due', false)).to.equal({
        text: 'Due',
        status: 'error'
      });
    });

    test('If return is void, return void badge', async () => {
      expect(badge.getBadge('void', false)).to.equal({
        text: 'Void',
        status: 'dark'
      });
    });

    test('If return is received, return received badge', async () => {
      expect(badge.getBadge('received', false)).to.equal({
        text: 'Received',
        status: undefined
      });
    });

    test('If return is completed, return received badge', async () => {
      expect(badge.getBadge('completed', false)).to.equal({
        text: 'Complete',
        status: undefined
      });
    });
  });
});
