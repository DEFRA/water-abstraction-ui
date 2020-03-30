'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { mapBadgeToTag } = require('shared/view/nunjucks/filters/tag');

experiment('shared/view/nunjucks/filters/tag', () => {
  experiment('.mapBadgeToTag', () => {
    test('when text and status are passed in as strings', () => {
      const result = mapBadgeToTag('Pending', 'inactive');
      expect(result).to.equal({
        text: 'Pending',
        classes: 'govuk-tag--grey'
      });
    });

    test('when no status is defined, blue is default colour', async () => {
      const result = mapBadgeToTag({ text: 'Default' });
      expect(result).to.equal({
        text: 'Default',
        classes: 'govuk-tag--blue'
      });
    });

    test('when large size is defined, additional class is added', async () => {
      const result = mapBadgeToTag({ text: 'Default', size: 'large' });
      expect(result).to.equal({
        text: 'Default',
        classes: 'govuk-tag--blue govuk-!-font-size-27'
      });
    });

    test('when status is "inactive", colour is grey', async () => {
      const result = mapBadgeToTag({ text: 'Test', status: 'inactive' });
      expect(result).to.equal({
        text: 'Test',
        classes: 'govuk-tag--grey'
      });
    });

    test('when status is "success", colour is green', async () => {
      const result = mapBadgeToTag({ text: 'Test', status: 'success' });
      expect(result).to.equal({
        text: 'Test',
        classes: 'govuk-tag--green'
      });
    });

    test('when status is "error", colour is red', async () => {
      const result = mapBadgeToTag({ text: 'Test', status: 'error' });
      expect(result).to.equal({
        text: 'Test',
        classes: 'govuk-tag--red'
      });
    });

    test('when status is "warning", colour is orange', async () => {
      const result = mapBadgeToTag({ text: 'Test', status: 'warning' });
      expect(result).to.equal({
        text: 'Test',
        classes: 'govuk-tag--orange'
      });
    });

    test('when status is "todo", colour is blue', async () => {
      const result = mapBadgeToTag({ text: 'Test', status: 'todo' });
      expect(result).to.equal({
        text: 'Test',
        classes: 'govuk-tag--blue'
      });
    });
  });
});
