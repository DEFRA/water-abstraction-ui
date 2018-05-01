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
    return value.join('\n');
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
    const m = moment().date(day).month(month).year(year);
    return m.format('YYYY-MM-DD');
  },
  export: (value) => {
    const m = moment(value, 'YYYY-MM-DD');
    return {
      day: m.date(),
      month: m.month(),
      year: m.year()
    };
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
    this.data = JSON.parse(str);
  }

  /**
   * Get data as JSON string
   * @return {String}
   */
  toJson () {
    return JSON.stringify(this.data);
  }

  /**
   * Parse a form payload
   * @param {Object} payload - from HAPI request.payload
   * @param {Number} step - the index of the step to process
   */
  processRequest (payload, step) {
    this.task.config.steps[step].widgets.forEach(widget => {
      const { name, mapper = 'default' } = widget;
      this.data.query[name] = this.mappers[mapper].import(name, payload);
    });
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
        if (widget.operator === '$in') {
          filter[widget.name] = { $in: this.data.query[widget.name] };
        }
      });
    });
    return filter;
  }
}

module.exports = TaskData;
