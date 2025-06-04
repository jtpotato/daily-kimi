import { TwitterApi } from "twitter-api-v2";
import { images } from "./images.json";
import sharp from "sharp";

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

// choose a random image from images
const randomImage = images[Math.floor(Math.random() * images.length)];
console.log("Random image chosen:", randomImage);

// temporarily save image to file
const response = await fetch(randomImage);
const imageBuffer = await response.arrayBuffer();
await sharp(Buffer.from(imageBuffer)).jpeg().toFile("randomImage.jpg");

// post a tweet with the random image
let media = await client.v1.uploadMedia("randomImage.jpg", {
  type: "jpg",
});

client.v2
  .tweet("", {
    media: { media_ids: [media] },
  })
  .then((response) => {
    console.log("Tweet posted successfully:", response.data);
  })
  .catch((error) => {
    console.error("Error posting tweet:", error);
  });
