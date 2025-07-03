import { UTApi } from "uploadthing/server";
import sharp from "sharp";
import fs from "fs";
import { exit } from "process";
import { execSync } from "child_process";

// read caption from caption.txt
const caption = await Bun.file("caption.txt").text();

// read buffer from file named 'imagedump' with no extension
const imageBuffer = await Bun.file("imagedump").arrayBuffer();
// convert image to jpeg
const jpegBuffer = await sharp(imageBuffer).jpeg().toBuffer();

// save to file for testing
fs.writeFileSync("imagedump.jpg", jpegBuffer);

// make blob from jpeg buffer
const blob = new Blob([jpegBuffer], { type: "image/jpeg" });
const jsFile = new File([blob], "imagedump.jpg", { type: "image/jpeg" });

// upload to uploadthing
const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN || "" });
const res = await utapi.uploadFiles([jsFile]);

let urls = res.map((file) => file.data?.ufsUrl);

// edit images.json to include image url and caption.
const imagesJsonPath = "images.json";
let imagesJson: { images: { link: string; caption: string }[] } = {
  images: [],
};

if (fs.existsSync(imagesJsonPath)) {
  const existingData = await Bun.file(imagesJsonPath).text();
  imagesJson = JSON.parse(existingData);
}

imagesJson.images.push({
  link: urls[0] || "",
  caption: caption.trim(),
});

// Stage the updated images.json file
execSync("git add images.json");

// Commit the changes with a message
execSync('git commit -m "Update images.json with new image and caption"');

// Push the changes to the remote repository
execSync("git push");

await Bun.write(imagesJsonPath, JSON.stringify(imagesJson, null, 2));
console.log("Image uploaded and images.json updated successfully.");
