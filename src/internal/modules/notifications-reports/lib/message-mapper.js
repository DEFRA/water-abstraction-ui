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

const checkBoxItems = filter => {
  if (!filter) {
    filter = [];
  }
  const returnsData = [];
  returnsData.push({ value: 'notification_letter', text: 'Returns: send paper forms' });
  returnsData.push({ value: 'returns_invitation_letter', text: 'Returns: invitation' });
  returnsData.push({ value: 'returns_final_reminder', text: 'Returns: reminder' });
  returnsData.push({ value: 'expiry_notification_email', text: 'Expiring licence(s): invitation to renew' });
  returnsData.push({ value: 'water_abstraction_alert_reduce_warning', text: 'Hands off flow: levels warning' });
  returnsData.push({ value: 'water_abstraction_alert_reduce_or_stop_warning', text: 'Hands off flow: stop or reduce abstraction' });
  returnsData.push({ value: 'water_abstraction_alert_resume', text: 'Hands off flow: resume abstraction' });

  return returnsData.map(row => {
    return {
      ...row,
      checked: filter.includes(row.value)
    };
  });
};

const mapResponseToView = (response, request) => {
  const { filter, sentBy } = request.query;
  return {
    ...response,
    filter,
    sentBy,
    checkBoxItems: checkBoxItems(filter)
  };
};
exports.mapResponseToView = mapResponseToView;
exports.mapMessage = mapMessage;
