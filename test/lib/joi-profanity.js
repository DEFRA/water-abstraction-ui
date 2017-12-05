'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Code = require('code')
const BaseJoi = require('joi');

const joiProfanity = require('../../src/lib/joi-profanity');
const Joi = BaseJoi.extend(joiProfanity);

const schema = {
  str : Joi.string().profanity()
};

lab.experiment('joiProfanity extension', () => {

  lab.test('Should pass when string contains no profanity', async () => {

    const {error, value} = Joi.validate({str : 'Polite text here'}, schema);
    Code.expect(error).to.equal(null);

  });

  lab.test('Should error when string contains profanity', async () => {

    const {error, value} = Joi.validate({str : 'Some crap text here'}, schema);
    Code.expect(error.details[0].type).to.equal('string.profanity');

  });

});
