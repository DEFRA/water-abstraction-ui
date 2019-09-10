const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const paginationHelper = require('shared/view/handlebars/helpers/pagination');

experiment('shared/view/handlebars/helpers/pagination', () => {
  test('returns null when pageCount is 0', async () => {
    const pagination = { page: 1, pageCount: 0 };
    const hash = { url: '/', params: {} };
    const result = paginationHelper(pagination, { hash });

    expect(result).to.be.null();
  });

  test('for three pages the expected html is returned', async () => {
    const expectedHtml = `
    <nav role="navigation" aria-label="Pagination navigation">
      <ol class="pagination">
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=1" aria-label="Previous page">&larr; Previous page</a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=1">
            <span class="sr-only">Page </span> 1
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link pagination__link--active" href="/?one=1&two=2&page=2">
            <span class="sr-only">Page </span> 2
            <span class="sr-only"> - current page</span>
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=3">
            <span class="sr-only">Page </span> 3
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=3">Next page &rarr;</a>
        </li>
      </ol>
    </nav>`;

    const pagination = { page: 2, pageCount: 3 };
    const hash = { url: '/', params: { one: 1, two: 2 } };
    const result = paginationHelper(pagination, { hash });

    expect(result).to.equal(expectedHtml);
  });

  test('on the first page the expected html is returned', async () => {
    const expectedHtml = `
    <nav role="navigation" aria-label="Pagination navigation">
      <ol class="pagination">
        <li class="pagination__item" aria-hidden="true">&larr; Previous page</li>
        <li class="pagination__item">
          <a class="pagination__link pagination__link--active" href="/?one=1&two=2&page=1">
            <span class="sr-only">Page </span> 1
            <span class="sr-only"> - current page</span>
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=2">
            <span class="sr-only">Page </span> 2
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=3">
            <span class="sr-only">Page </span> 3
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=2">Next page &rarr;</a>
        </li>
      </ol>
    </nav>`;

    const pagination = { page: 1, pageCount: 3 };
    const hash = { url: '/', params: { one: 1, two: 2 } };
    const result = paginationHelper(pagination, { hash });

    expect(result).to.equal(expectedHtml);
  });

  test('on the last page the expected html is returned', async () => {
    const expectedHtml = `
    <nav role="navigation" aria-label="Pagination navigation">
      <ol class="pagination">
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=2" aria-label="Previous page">&larr; Previous page</a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=1">
            <span class="sr-only">Page </span> 1
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link" href="/?one=1&two=2&page=2">
            <span class="sr-only">Page </span> 2
          </a>
        </li>
        <li class="pagination__item">
          <a class="pagination__link pagination__link--active" href="/?one=1&two=2&page=3">
            <span class="sr-only">Page </span> 3
            <span class="sr-only"> - current page</span>
          </a>
        </li>
        <li class="pagination__item" aria-hidden="true">Next page &rarr;</li>
      </ol>
    </nav>`;

    const pagination = { page: 3, pageCount: 3 };
    const hash = { url: '/', params: { one: 1, two: 2 } };
    const result = paginationHelper(pagination, { hash });

    expect(result).to.equal(expectedHtml);
  });
});
