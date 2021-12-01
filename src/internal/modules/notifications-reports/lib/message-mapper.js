'use strict';

const titleCase = require('title-case');

const isErrorStatus = status => status === 'error';

/**
   * Maps the displayStatus from the water service to a badge
   * object which will render via Nunjucks
   *
   * @param {String} status
   */
const messageStatusBadgeMapper = status => {
  const text = titleCase(status);
  return isErrorStatus(status) ? { text, status } : { text };
};

const mapMessage = message => ({
  ...message,
  badge: messageStatusBadgeMapper(message.displayStatus)
});

const checkBoxItems = (filter, notificationCategories) => {
  if (!filter) {
    filter = [];
  }
  const returnsData = [];
  notificationCategories.forEach(category => {
    returnsData.push({ value: category.value, text: category.label });
  });

  return returnsData.map(row => {
    return {
      ...row,
      checked: filter.includes(row.value)
    };
  });
};

const mapResponseToView = (response, request, notificationCategories) => {
  const { filter, sentBy } = request.query;
  return {
    ...response,
    filter,
    sentBy,
    checkBoxItems: checkBoxItems(filter, notificationCategories)
  };
};
exports.mapResponseToView = mapResponseToView;
exports.mapMessage = mapMessage;
