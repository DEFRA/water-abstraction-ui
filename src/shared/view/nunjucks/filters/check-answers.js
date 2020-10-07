'use strict';

/**
 * Maps controller check your answers list to GOV.uk component properties
 * @param {Array} answers
 * @return {Object} suitable for use in govukSummaryList component
 */
const checkAnswers = answers => ({
  rows: answers.map(answer => ({
    key: {
      text: answer.label
    },
    value: {
      text: answer.value
    },
    actions: {
      items: [
        {
          href: answer.link,
          text: 'Change',
          visuallyHiddenText: answer.visuallyHiddenText
        }
      ]
    }
  }))
});

exports.checkAnswers = checkAnswers;
