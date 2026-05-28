const fetch = require('node-fetch'); // If using node 18+, fetch is built-in

async function test() {
  try {
    const res = await fetch('http://localhost:3000/v1/therapists');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("ERROR:", err);
  }
}

test();
