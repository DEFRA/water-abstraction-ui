module.exports = {
  ...require('./abstraction-reform'),
  ...require('./most-significant-entity-role'),

  ...require('../../../../shared/view/nunjucks/filters/abstraction-period'),
  ...require('../../../../shared/view/nunjucks/filters/date'),
  ...require('../../../../shared/view/nunjucks/filters/fixed'),
  ...require('../../../../shared/view/nunjucks/filters/form'),
  ...require('../../../../shared/view/nunjucks/filters/markdown'),
  ...require('../../../../shared/view/nunjucks/filters/merge'),
  ...require('../../../../shared/view/nunjucks/filters/number'),
  ...require('./pluralize'),
  ...require('./query-string'),
  ...require('./slice'),
  ...require('./sort-new-direction'),
  ...require('./sort-query'),
  ...require('./title-case'),
  ...require('./unit-conversion'),
  ...require('./units')
};
