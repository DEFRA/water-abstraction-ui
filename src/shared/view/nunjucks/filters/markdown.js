const marked = require('marked');

/**
 * Notify's flavour of markdown uses caret for blcokquote so
 * replace any carets with '>' for correct rendering.
 */
const markdown = (input = '') => {
  const replacedCaret = input.replace(/\^/gm, '>');
  return marked(replacedCaret, {
    headerIds: false
  });
};

exports.markdown = markdown;
