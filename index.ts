import { TwitterApi } from "twitter-api-v2";
import { images } from "./images.json";

// Define the type for history
let history: { caption: string; link: string }[] =
  require("./images.json").history;
import sharp from "sharp";
import fs from "fs";

// check if environment variables are set
if (
  !process.env.API_KEY ||
  !process.env.API_KEY_SECRET ||
  !process.env.OAUTH_TOKEN ||
  !process.env.OAUTH_SECRET
) {
  console.error(
    "Please set the API_KEY, API_KEY_SECRET, OAUTH_TOKEN, and OAUTH_SECRET environment variables."
  );
  process.exit(1);
}

const client = new TwitterApi({
  appKey: process.env.API_KEY || "",
  appSecret: process.env.API_KEY_SECRET || "",
  accessToken: process.env.OAUTH_TOKEN || "",
  accessSecret: process.env.OAUTH_SECRET || "",
});

// log in

client.v2
  .me()
  .then((user) => {
    console.log("Logged in as:", user.data.name);
  })
  .catch((error) => {
    console.error("Error logging in:", error);
  });

// choose a random image from images that is not in history
const filteredImages = images.filter((image) => {
  return !history.some((h) => h.link === image.link);
});

// if history is the same length as images - 1, reset history
if (history.length > images.length - 1) {
  console.log("History is too long, clearing history...");
  history = history.slice(-1);
}

const randomImage =
  filteredImages[Math.floor(Math.random() * filteredImages.length)];
console.log("Random image chosen:", randomImage);

// add to history
history.push(randomImage);
// save history to file
fs.writeFileSync("./images.json", JSON.stringify({ images, history }, null, 2));

// temporarily save image to file
const response = await fetch(randomImage.link);
const imageBuffer = await response.arrayBuffer();
await sharp(Buffer.from(imageBuffer)).jpeg().toFile("randomImage.jpg");

// post a tweet with the random image
let media = await client.v1.uploadMedia("randomImage.jpg", {
  type: "jpg",
});

client.v2
  .tweet(randomImage.caption, {
    media: { media_ids: [media] },
  })
  .then((response) => {
    console.log("Tweet posted successfully:", response.data);
  })
  .catch((error) => {
    console.error("Error posting tweet:", error);
  });
