const Joi = require('joi');

const schema = Joi.object({
  one: Joi.number().required(),
  two: Joi.number().optional()
});

console.log(schema.validate({ one: 1 }, {
  allowUnknown: true,
  stripUnknown: true
}));

console.log(schema.validate({ one: 1, two: 2 }, {
  allowUnknown: true,
  stripUnknown: true
}));

console.log(schema.validate({ one: 1, three: 3 }, {
  allowUnknown: true,
  stripUnknown: true
}));
