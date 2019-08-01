'use strict';
const { experiment, test, fail } = exports.lab = require('@hapi/lab').script();
const { set } = require('lodash');
const { expect } = require('@hapi/code');

const { scope } = require('internal/lib/constants');
const permission = require('internal/modules/notifications/lib/permission');

const createTask = subType => ({
  subtype: subType
});

const createRequest = scope => {
  const request = {};
  set(request, 'auth.credentials.scope', scope);
  return request;
};

experiment('notification permissions', () => {
  experiment('getNotificationScope', () => {
    test('gets HoF notification scope for hof-resume notification', async () => {
      const task = createTask('hof-resume');
      expect(permission.getNotificationScope(task))
        .to.equal(scope.hofNotifications);
    });

    test('gets HoF notification scope for hof-stop notification', async () => {
      const task = createTask('hof-stop');
      expect(permission.getNotificationScope(task))
        .to.equal(scope.hofNotifications);
    });

    test('gets HoF notification scope for hof-warning notification', async () => {
      const task = createTask('hof-warning');
      expect(permission.getNotificationScope(task))
        .to.equal(scope.hofNotifications);
    });

    test('gets renewal notification scope for renewal notification', async () => {
      const task = createTask('renewal');
      expect(permission.getNotificationScope(task))
        .to.equal(scope.renewalNotifications);
    });

    test('throws error for unknown notification subtype', async () => {
      const task = createTask('invalid-subtype');
      const func = () => permission.getNotificationScope(task);
      expect(func).to.throw();
    });
  });

  experiment('checkAccess', () => {
    test('when the request has the correct scope, returns undefined', async () => {
      const request = createRequest(scope.hofNotifications);
      const task = createTask('hof-stop');
      const result = permission.checkAccess(request, task);
      expect(result).to.be.undefined();
    });

    test('when the request has incorrect scope, throws a Boom unauthorized error', async () => {
      const request = createRequest(scope.hofNotifications);
      const task = createTask('renewal');
      try {
        permission.checkAccess(request, task);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(401);
      }
    });
  });
});
