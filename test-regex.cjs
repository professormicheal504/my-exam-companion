const he = require('node:fs');

function cleanText(htmlStr) {
  if (!htmlStr) return '';
  let text = String(htmlStr).replace(/<[^>]*>?/gm, '');
  text = text.replace(/\\\(/g, '').replace(/\\\)/g, '').replace(/\^2/g, '²').replace(/\^3/g, '³');
  return text;
}

let q = "143cm\\(^2\\)"; // double escaped (as it would be in raw JSON payload)
console.log("JSON decoded string:", q);
console.log("Cleaned:", cleanText(q));

let q2 = "143cm\(^2\)"; // single escaped 
console.log("Single escaped string:", q2);
console.log("Cleaned:", cleanText(q2));
