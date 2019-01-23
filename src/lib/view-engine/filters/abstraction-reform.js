const deepMap = require('deep-map');
const Nunjucks = require('nunjucks');
const Entities = require('html-entities').AllHtmlEntities;
const htmlEntityEncoder = new Entities();

/**
 * For the abstraction reform comparison table, maps the data from the view
 * to the data format expected by the GOV UK frontend table component
 * @param  {Object} data - view data for a particular NALD item, e.g. purpose, point
 * @return {Object}      - Nunjucks table component options
 */
const mapARComparisonTable = (data) => {
  const keys = Object.keys(data.base);

  const rows = keys.map(key => ([
    { text: key },
    { text: data.base[key] },
    { text: data.base[key] === data.reform[key] ? null : data.reform[key] }
  ]));

  return {
    head: [
      {
        text: 'NALD field'
      },
      {
        text: 'NALD data'
      },
      {
        text: 'New value'
      }
    ],
    rows
  };
};

/**
 * Replaces condition text template with bolded placeholders
 * @param  {String} str  - condition text template
 * @return {String} rendered condition text string with bolded values
 */
const ARConditionPlaceholder = (str) => {
  let tpl = htmlEntityEncoder.encode(str);
  tpl = tpl.replace(/\[/g, '<strong>[');
  return tpl.replace(/\]/g, ']</strong>');
};

module.exports = {
  mapARComparisonTable,
  ARConditionPlaceholder
};
