const fetch = require('node-fetch');
async function test() {
  const res = await fetch('http://localhost:8001/api/deen/prayers/history?days=14');
  const json = await res.json();
  console.log(Array.isArray(json), json.length);
}
test();
