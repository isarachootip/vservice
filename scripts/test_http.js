const http = require("http");

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`URL: ${url} -> Status: ${res.statusCode}`);
      resolve(res.statusCode);
    }).on("error", (err) => {
      console.log(`URL: ${url} -> Error: ${err.message}`);
      resolve(null);
    });
  });
}

async function main() {
  await checkUrl("http://localhost:2001/uploads/config/Gemini_Generated_Image_cx140gzo84rgoz84.jpg");
  await checkUrl("http://localhost:2001/api/maintain/example-images?flow=create_repair");
}

main();
