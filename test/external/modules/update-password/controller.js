'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const controller = require('external/modules/update-password/controller');

/**
 * Note current version test of 'code' can't test for async function
 * @see {@link https://github.com/hapijs/code/issues/103}
 */
function isAsync (fn) {
  return fn.constructor.name === 'AsyncFunction';
}

lab.experiment('Check methods on update password controller', () => {
  lab.test('getConfirmPassword function exists', async () => {
    Code.expect(isAsync(controller.getConfirmPassword)).to.equal(true);
  });

  lab.test('postConfirmPassword function exists', async () => {
    Code.expect(isAsync(controller.postConfirmPassword)).to.equal(true);
  });

  lab.test('postSetPassword function exists', async () => {
    Code.expect(isAsync(controller.postSetPassword)).to.equal(true);
  });

  lab.test('getPasswordUpdated function exists', async () => {
    Code.expect(isAsync(controller.getPasswordUpdated)).to.equal(true);
  });
});
