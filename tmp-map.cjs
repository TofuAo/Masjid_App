const fs = require('fs');
const { SourceMapConsumer } = require('source-map');
const map = JSON.parse(fs.readFileSync('dist/assets/index-gHP4PQnA.js.map', 'utf8'));
SourceMapConsumer.with(map, null, consumer => {
  const orig = consumer.originalPositionFor({ line: 421, column: 14000 });
  console.log(orig);
});
