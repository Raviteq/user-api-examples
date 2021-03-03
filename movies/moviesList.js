const fs = require('fs');
const parse = require('csv-parse/lib/sync');

const file = `${__dirname}/movies.csv`;

module.exports.get = options => {
  const content = fs.readFileSync(file);
  return parse(content, {
    columns: true,
    to_line: options.limit + 1
  });
};