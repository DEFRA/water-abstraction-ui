'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const helpers = require('shared/modules/returns/forms/common');

experiment('shared/modules/returns/forms/common', () => {
  experiment('.getSuffix', () => {
    test('handles superscript', async () => {
      expect(helpers.getSuffix('m³')).to.equal('cubic metres');
      expect(helpers.getSuffix('m3')).to.equal('cubic metres');
    });
  });
});
