# Validation Adapters

A form can be validated and have it's errors managed by different validation tools.

The default is to use Joi but others can be used if they conform to the required interface.

A new adapter must implement the following functions:

createSchemaFromForm (form: object)
validate (requestData: object, schema: object, options: object)
applyErrors (form: object, error: object, customErrors: object)

See the [Joi](./joi.js) implementation for more details
