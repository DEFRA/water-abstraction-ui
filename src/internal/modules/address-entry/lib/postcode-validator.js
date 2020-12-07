'use strict';

const Joi = require('@hapi/joi');

// https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation
const regex = /^(([A-Z]{1,2}[0-9][A-Z0-9]?|ASCN|STHL|TDCU|BBND|[BFS]IQQ|PCRN|TKCA) ?[0-9][A-Z]{2}|BFPO ?[0-9]{1,4}|(KY[0-9]|MSR|VG|AI)[ -]?[0-9]{4}|[A-Z]{2} ?[0-9]{2}|GE ?CX|GIR ?0A{2}|SAN ?TA1)$/;

const schema = Joi.string().required()
// uppercase and remove any spaces (BS1 1SB -> BS11SB)
  .uppercase().replace(/ /g, '')
// then ensure the space is before the inward code (BS11SB -> BS1 1SB)
  .replace(/(.{3})$/, ' $1').regex(regex);

exports.postcodeRegex = regex;
exports.postcodeSchema = schema;
