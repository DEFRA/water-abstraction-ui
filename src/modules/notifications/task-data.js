/**
 * A class for managing state during the notification flow
 * the class must import/export from a JSON string which is used to store
 * state from the previous steps.
 * It must also parse the request payload of the current step, and for fields
 * such as dates which have multiple fields for a single value, mappers
 * allow the mapping of data to and from these fields
 * @module src/modules/notifications/task-data
 */
const moment = require('moment');
const { extractLicenceNumbers } = require('../../lib/licence-helpers');
const Joi = require('joi');
const { find } = require('lodash');

/**
 * Default mapper - simply extracts the value of the named field
 */
const defaultMapper = {
  import: (fieldName, payload) => {
    return payload[fieldName];
  },
  export: (value) => {
    return value;
  }
};

/**
 * Delimited mapper - for a pasted set of licence numbers, splits string on common
 * delimiters , newlines, tabs, semicolon
 */
const licenceNumbersMapper = {
  import: (fieldName, payload) => {
    return extractLicenceNumbers(payload[fieldName]);
  },
  export: (value) => {
    return value.join(', ');
  }
};

/**
 * Date mapper - combines the day month and year form values to a single
 * string formatted as YYYY-MM-DD
 */
const dateMapper = {
  import: (fieldName, payload) => {
    const day = payload[fieldName + '-day'];
    const month = payload[fieldName + '-month'];
    const year = payload[fieldName + '-year'];
    const m = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    return m.isValid() ? m.format('YYYYMMDD') : undefined;
  },
  export: (value) => {
    if (value) {
      const m = moment(value, 'YYYYMMDD');
      return m.format('D MMM YYYY');
    }
    return null;
  }
};

class TaskData {
  constructor (task) {
    // Task config data
    this.task = task;

    // Initialise data to empty state
    this.data = {
      // The query data input by the user
      query: {},
      // List of licence numbers following refine audience step
      licenceNumbers: [],
      // Custom template parameter data
      params: {}
    };

    // Initialise available mappers
    this.mappers = {
      default: defaultMapper,
      date: dateMapper,
      licenceNumbers: licenceNumbersMapper
    };
  }

  /**
   * Loads task data as string
   * @param {String} str
   */
  fromJson (str) {
    if (str) {
      this.data = JSON.parse(str);
    }
  }

  /**
   * Get data as JSON string
   * @return {String}
   */
  toJson () {
    return JSON.stringify(this.data);
  }

  /**
   * Add licence number list to data
   * @param {Array} licenceNumbers
   */
  setLicenceNumbers (licenceNumbers) {
    this.data.licenceNumbers = licenceNumbers;
  }

  /**
   * Get licence numbers
   * @return {Array}
   */
  getLicenceNumbers () {
    return this.data.licenceNumbers;
  }

  /**
   * Set custom template parameter data
   * @param {Object} payload - from HAPI request interface
   */
  processParameterRequest (payload) {
    const { variables: widgets } = this.task.config;

    // Create Joi schema for validating parameters
    const schema = this.createJoiSchema(widgets);

    widgets.forEach(widget => {
      const { name, mapper = 'default' } = widget;
      this.data.params[name] = this.mappers[mapper].import(name, payload);
    });

    const { error } = Joi.validate(this.data.params, schema, { allowUnknown: true });

    return { error: this.mapJoiError(error, widgets) };
  }

  /**
   * Get parameter data
   * @return {Object} template variable params
   */
  getParameters () {
    return this.data.params;
  }

  /**
   * Creates a Joi schema for the supplied array of widgets
   * @param {Array} widgets
   * @return {Object} Joi schema
   */
  createJoiSchema (widgets) {
    return widgets.reduce((acc, widget) => {
      if (widget.validation) {
        let validator = Joi;

        // The validation represents Joi validation config as an array, e.g.
        // ['string', 'min:1']
        widget.validation.forEach(str => {
          const parts = str.split(':');
          const cmd = parts[0];
          const value = parts.length ? parts[1] : null;

          if (cmd === 'array') {
            validator = validator.array();
          }
          if (cmd === 'string') {
            validator = validator.string();
          }
          if (cmd === 'required') {
            validator = validator.required();
          }
          if (cmd === 'min') {
            validator = validator.min(parseInt(value, 10));
          }
        });

        acc[widget.name] = validator;
      }
      return acc;
    }, {});
  }

  /**
   * Finds a widget within one of the steps by the fieldname
   * @param {String} name - the field name
   * @param {Array} widgets - list of widgets to search in
   * @return {Object} widget definition
   */
  findWidgetByName (name, widgets) {
    return find(widgets, { name });
  }

  /**
   * Map Joi errors into an easily consumable form
   * @param {Object} error - Joi errors
   * @param {Array} widgets - list of widgets for the current step/variables
   * @return {Object} errors in a simple boolean form simple to consume in the view
   */
  mapJoiError (error, widgets) {
    if (!error) {
      return error;
    }

    return error.details.reduce((acc, detail) => {
      const field = detail.path[0];
      const widget = this.findWidgetByName(field, widgets);

      const label = widget.error_label || widget.label;
      const messages = {
        'any.required': `The ${label} field is required`,
        'array.min': `At least ${detail.context.limit} value is required in the ${label} field`,
        'any.empty': `The ${label} field is required`
      };

      acc.push({
        message: messages[detail.type],
        field
      });

      return acc;
    }, []);
  }

  /**
   * Parse a form payload
   * @param {Object} payload - from HAPI request.payload
   * @param {Number} step - the index of the step to process
   * @return {error} - Joi validation errors
   */
  processRequest (payload, step) {
    const { widgets } = this.task.config.steps[step];

    // Use mappers to build the query as the result of the POST data from the
    // current step
    const query = widgets.reduce((acc, widget) => {
      const { name, mapper = 'default' } = widget;
      return {
        ...acc,
        [name]: this.mappers[mapper].import(name, payload)
      };
    }, {});
    // Merge with existing query from previous steps
    this.data.query = {
      ...this.data.query,
      ...query
    };

    const { error } = Joi.validate(query, this.createJoiSchema(widgets), { allowUnknown: true });

    return { error: this.mapJoiError(error, widgets) };
  }

  /**
   * Export query data using mappers
   * this returns an object with all the query fields the user has filled in,
   * with the data mapped from the internal format (e.g. 2018-06-01) back to
   * a form in which it was input {day :1, month : 6, year: 2018}
   * @return {Object}
   */
  exportQuery () {
    const query = {};
    this.task.config.steps.forEach(step => {
      step.widgets.forEach(widget => {
        const { name, mapper = 'default' } = widget;
        query[name] = this.mappers[mapper].export(this.data.query[name]);
      });
    });
    return query;
  }

  /**
   * Export mongo-sql style filter for use in query
   * @return Object
   */
  getFilter () {
    // Build query filter
    const filter = {};
    this.task.config.steps.forEach(step => {
      step.widgets.forEach(widget => {
        if (widget.operator === '=') {
          filter[widget.name] = this.data.query[widget.name];
        }
        if (widget.operator === '$in' && this.data.query[widget.name].length) {
          filter[widget.name] = { $in: this.data.query[widget.name] };
        }
        if (widget.operator === '$lte') {
          filter[widget.name] = { $lte: this.data.query[widget.name] };
        }
      });
    });
    return filter;
  }
}

module.exports = TaskData;
