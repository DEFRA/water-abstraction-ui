'use strict';
const moment = require('moment');

const isCurrentAddress = accountAddress =>
  accountAddress.dateRange.endDate === null;

/**
 * Gets the current billing account address
 * @param {Object} billingAccount
 * @returns {Object}
 */
const getCurrentAddress = billingAccount =>
  billingAccount.invoiceAccountAddresses.find(isCurrentAddress);

const generateBillingAccountMetadata = billingAccount => {
  let metadataHtml = `<div class="govuk-summary-list__row-with-minimal-spacing">
        <dt class="govuk-summary-list__value">
          Date created
        </dt>
        <dd class="govuk-summary-list__value meta-data__value">
          ${moment(billingAccount.dateCreated).format('D MMMM YYYY')}
        </dd>
      </div>`;

  metadataHtml += billingAccount.lastTransactionFileReference
    ? `<div class="govuk-summary-list__row-with-minimal-spacing">
    <dt class="govuk-summary-list__value">
      Customer file
    </dt>
    <dd class="govuk-summary-list__value meta-data__value">
      ${billingAccount.lastTransactionFileReference}
    </dd>
  </div>`
    : '';

  metadataHtml += moment(billingAccount.dateLastTransactionFileReferenceUpdated).isValid()
    ? `<div class="govuk-summary-list__row-with-minimal-spacing">
    <dt class="govuk-summary-list__value">
      Last updated
    </dt>
    <dd class="govuk-summary-list__value meta-data__value">
        ${moment(billingAccount.dateLastTransactionFileReferenceUpdated).format('D MMMM YYYY')}
    </dd>
  </div>`
    : '';

  return metadataHtml;
};

exports.getCurrentAddress = getCurrentAddress;
exports.generateBillingAccountMetadata = generateBillingAccountMetadata;
