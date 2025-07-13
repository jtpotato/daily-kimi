// Import required modules

// Pull latest changes from git
execSync("git pull");

// Read caption and image buffer
const caption = await Bun.file("caption.txt").text();
const imageBuffer = await Bun.file("imagedump").arrayBuffer();

// Convert image to JPEG and resize if needed
let jpegBuffer = await sharp(imageBuffer).jpeg().toBuffer();
const metadata = await sharp(jpegBuffer).metadata();
if (metadata.width && metadata.width > 1400) {
  jpegBuffer = await sharp(jpegBuffer)
    .resize({ width: 1400 })
    .jpeg()
    .toBuffer();
}

// Save JPEG for local testing
fs.writeFileSync("imagedump.jpg", jpegBuffer);

// Prepare image for upload
const blob = new Blob([jpegBuffer], { type: "image/jpeg" });
const jsFile = new File([blob], "imagedump.jpg", { type: "image/jpeg" });

// Upload image to UploadThing
const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN || "" });
const res = await utapi.uploadFiles([jsFile]);
let urls = res.map((file) => file.data?.ufsUrl);

// Path to images.json
const imagesJsonPath = "images.json";

// Load or initialize images.json
let imagesJson: { images: { link: string; caption: string }[] } = {
  images: [],
};

if (fs.existsSync(imagesJsonPath)) {
  const existingData = await Bun.file(imagesJsonPath).text();
  imagesJson = JSON.parse(existingData);
}

// Add new image and caption
imagesJson.images.push({
  link: urls[0] || "",
  caption: caption.trim(),
});

// Write updated images.json
await Bun.write(imagesJsonPath, JSON.stringify(imagesJson, null, 2));

// Stage, commit, and push changes to git
execSync("git add images.json");
execSync('git commit -m "Update images.json with new image and caption"');
execSync("git push");

console.log("Image uploaded and images.json updated successfully.");
