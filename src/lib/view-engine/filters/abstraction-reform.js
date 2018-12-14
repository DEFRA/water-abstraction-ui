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
 * Given a string e.g. Here is a [variable], the variable in square brackets
 * is wrapped in a <strong> tag
 * @param  {String} str - AR WR22 condition label
 * @return {String}     label with terms bolded
 */
const boldARVariables = (str) => {
  let s = str.replace(/\[/g, '<strong>[');
  s = s.replace(/\]/g, ']</strong>');
  return s;
};

module.exports = {
  mapARComparisonTable,
  boldARVariables
};
