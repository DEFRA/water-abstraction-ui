'use strict';

const qs = require('querystring');
const { compact } = require('lodash');

/**
 * Creates a pagination anchor tag for the pagination helper
 * @param {String} url - base URL, e.g. /some/page
 * @param {Object} params - key/value pairs of query string parameters, the page number will be merged with these
 * @param {Number} page - the page for the page link
 * @param {Object} options
 * @param {String} options.ariaLabel - the aria label text
 * @param {Boolean} options.isActive - whether this is an active pagination link
 * @return {String} link html
 */
const paginationLink = (url, params, page, options = {}) => {
  const fullUrl = `${url}?${qs.stringify({ ...params, page })}`;

  const cssClass = options.isActive
    ? 'pagination__link pagination__link--active'
    : 'pagination__link';

  const attributes = [
    `href="${fullUrl}"`,
    options.ariaLabel && `aria-label="${options.ariaLabel}"`
  ];

  return `<a class="${cssClass}" ${compact(attributes).join(' ')}>`;
};

const getListItemOpenTag = isHidden => {
  const attributes = isHidden ? ' aria-hidden="true"' : '';
  return `<li class="pagination__item"${attributes}>`;
};

const getNextLink = (url, params, page, pageCount) => {
  const next = getListItemOpenTag(page === pageCount);

  if (page < pageCount) {
    return next + `
          ${paginationLink(url, params, page + 1, { arialLabel: 'Next page' })}Next page &rarr;</a>
        </li>`;
  }

  return next + 'Next page &rarr;</li>';
};

const getPreviousLink = (url, params, page) => {
  const previous = getListItemOpenTag(page === 1);

  if (page > 1) {
    return previous + `
          ${paginationLink(url, params, page - 1, { ariaLabel: 'Previous page' })}&larr; Previous page</a>
        </li>`;
  }
  return previous + '&larr; Previous page</li>';
};

const getPageNumberText = (pageNumber, isCurrentPage) => {
  const html = `<span class="sr-only">Page </span> ${pageNumber}`;

  return isCurrentPage
    ? html + '\n            <span class="sr-only"> - current page</span>'
    : html;
};

const getPageLinks = (url, params, page, pageCount) => {
  let html = '';

  for (let i = 1; i <= pageCount; i++) {
    const isCurrentPage = page === i;

    html += `${i > 1 ? '\n        ' : ''}${getListItemOpenTag()}
          ${paginationLink(url, params, i, { isActive: isCurrentPage })}
            ${getPageNumberText(i, isCurrentPage)}
          </a>
        </li>`;
  }

  return html;
};

const pagination = (pagination = {}, options) => {
  const { url = '/', params = {} } = options.hash;
  const { page, pageCount = 0 } = pagination;

  if (pageCount <= 1) {
    return null;
  }

  return `
    <nav role="navigation" aria-label="Pagination navigation">
      <ol class="pagination">
        ${getPreviousLink(url, params, page)}
        ${getPageLinks(url, params, page, pageCount)}
        ${getNextLink(url, params, page, pageCount)}
      </ol>
    </nav>`;
};

module.exports = pagination;
