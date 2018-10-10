const joi = require('./joi');
const validationMap = { joi };

module.exports = {
  load: validatorName => {
    const validator = validationMap[validatorName];

    if (!validator) {
      const known = Object.keys(validationMap).join(', ');
      throw new Error(`Unknown validation adapter requested. Must be one of ${known}`);
    }

    return validator;
  }
};
