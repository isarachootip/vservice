const fs = require("fs");
const path = require("path");

const src = "C:\\Users\\isara\\.gemini\\antigravity\\brain\\97119789-4a48-43b9-b593-487c652b0368\\camera_serial_white_1784477170271.png";
const dest = path.join(__dirname, "..", "public", "uploads", "config", "Gemini_Generated_Image_xv7gt9vv1gt9vv7g.jpg");

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("Successfully replaced serial photo with white background version.");
} else {
  console.error("Source file not found:", src);
}
