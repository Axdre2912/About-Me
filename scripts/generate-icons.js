const sharp = require("sharp");

async function makeIcon(size, file) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="#5c7cfa"/>
    <text x="50%" y="54%" font-family="system-ui,sans-serif" font-size="${Math.round(size * 0.45)}" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">D</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log("Created", file);
}

Promise.all([
  makeIcon(192, "public/icon-192.png"),
  makeIcon(512, "public/icon-512.png"),
]).catch(console.error);
