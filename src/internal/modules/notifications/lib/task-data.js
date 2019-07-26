/**
 * A class for managing state during the notification flow
 * the class must import/export from a JSON string which is used to store
 * state from the previous steps.
 * It must also parse the request payload of the current step, and for fields
 * such as dates which have multiple fields for a single value, mappers
 * allow the mapping of data to and from these fields
 * @module src/internal/modules/notifications/task-data
 */
const nunjucks = require('nunjucks');
const Joi = require('@hapi/joi');
const { find } = require('lodash');
const { defaultMapper, licenceNumbersMapper, dateMapper, addressMapper } = require('./mappers');

// Create Nunjucks environment
// We don't need entity escaping since here Nunjucks is being used to populate an
// object held internally.  WHen data is output it is escaped as normal with
// Handlebars
const env = nunjucks.configure(null, {
  autoescape: false
});

class TaskData {
  /**
   * @param {Object} task - the task description from "water"."task_config" table
   * @param {Object} state - the current state of the task - loaded from session if mid-flow
   * @param {Object} context - data used for binding default values in parameters, e.g. contactdata from IDM
   */
  constructor (task, state, context = {}) {
    // Task config data
    this.task = task;
    this.context = context;

    if (state) {
      this.data = state;
    } else {
      // Initialise data to empty state
      this.data = {
        // The query data input by the user
        query: {},
        // List of licence numbers following refine audience step
        licenceNumbers: [],
        // Custom template parameter data
        params: this.getDefaultParams()
      };
    }

    // Initialise available mappers
    this.mappers = {
      default: defaultMapper,
      date: dateMapper,
      address: addressMapper,
      licenceNumbers: licenceNumbersMapper
    };
  }

  /**
   * Gets default parameter values.
   * These are taken from the 'default' key of the config variables,
   * and are rendered with Nunjucks using the context data.
   * This allows fields to pre-populated, e.g. with IDM data
   * @return {Object} key/value pairs
   */
  getDefaultParams () {
    const { variables = [] } = this.task.config;
    return variables.reduce((acc, v) => {
      if (v.default) {
        acc[v.name] = env.renderString(v.default, this.context);
      } else {
        acc[v.name] = undefined;
      }
      return acc;
    }, {});
  }

  /**
   * Returns the current task data
   * @return {Object}
   */
  getData () {
    return this.data;
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

    const { error } = Joi.validate(this.data.params, schema, { abortEarly: false, allowUnknown: true });

    return { error: this.mapJoiError(error, widgets) };
  }

  /**
   * Get parameter data
   * @return {Object} template variable params
   */
  getParameters () {
    const { variables } = this.task.config;
    return variables.reduce((acc, variable) => {
      const { name, mapper = 'default' } = variable;
      return {
        ...acc,
        [variable.name]: this.mappers[mapper].export(this.data.params[name])
      };
    }, {});
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

    const { error } = Joi.validate(query, this.createJoiSchema(widgets), { abortEarly: false, allowUnknown: true });

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
