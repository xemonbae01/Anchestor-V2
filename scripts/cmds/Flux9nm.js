const axios = require('axios');
const { getStreamFromURL } = global.utils;
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: "Flux9nm",
    version: "1.5",
    author: "Redwan",
    aliases: ["f9nm", "flux9"],
    countDown: 20,
    longDescription: {
      en: "Generate ultra-realistic images using Flux9nm prompts.",
    },
    category: "image",
    role: 2,
    guide: {
      en: "{pn} <prompt>",
    },
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(' ').trim();
    if (!prompt) return message.reply("Please provide a prompt to generate the image.");

    api.setMessageReaction("⌛", event.messageID, () => {}, true);
    message.reply("Processing your request. Please wait...", async (err, info) => {
      if (err) return console.error(err);

      try {
        // Step 1: Send the prompt to the API
        const apiUrl = `https://zaikyoov3-up.up.railway.app/api/mj-6.1?prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl);
        const { id, status, pollingUrl } = response.data;

        if (status !== 'processing') {
          return message.reply("Failed to initiate image generation. Please try again.");
        }

        // Step 2: Polling for image generation completion
        let pollStatus = 'processing';
        let imageUrls = [];
        while (pollStatus === 'processing') {
          const pollResponse = await axios.get(pollingUrl);
          pollStatus = pollResponse.data.status;

          if (pollStatus === 'completed') {
            imageUrls = pollResponse.data.urls;
          } else {
            await new Promise(resolve => setTimeout(resolve, 5000)); // wait for 5 seconds before polling again
          }
        }

        if (!imageUrls || imageUrls.length !== 4) {
          api.setMessageReaction("❌", event.messageID, () => {}, true);
          return message.reply("Image generation failed. Please try again.");
        }

        // Step 3: Create a collage from the 4 images
        const images = await Promise.all(imageUrls.map(url => loadImage(url)));
        const canvas = createCanvas(1024, 1024);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(images[0], 0, 0, 512, 512);
        ctx.drawImage(images[1], 512, 0, 512, 512);
        ctx.drawImage(images[2], 0, 512, 512, 512);
        ctx.drawImage(images[3], 512, 512, 512, 512);

        const outputPath = path.join(__dirname, 'cache', `collage_${event.senderID}.png`);
        const out = fs.createWriteStream(outputPath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", async () => {
          api.setMessageReaction("✅", event.messageID, () => {}, true);

          const msg = {
            body: "Flux9nm process completed ✨\n\n❏ Action: U1, U2, U3, U4",
            attachment: fs.createReadStream(outputPath),
          };

          message.reply(msg, (err, info) => {
            if (err) return console.error(err);
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID,
              images: imageUrls,
            });
          });
        });

      } catch (error) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        console.error(error);
        message.reply("An error occurred while generating the image. Please try again later.");
      }
    });
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { author, images } = Reply;

    if (event.senderID !== author) {
      return message.reply("Only the user who initiated the command can select an image.");
    }

    const input = event.body.trim().toUpperCase();
    const match = input.match(/^U([1-4])$/);

    if (!match) {
      return message.reply("Invalid input. Please reply with U1, U2, U3, or U4 to select an image.");
    }

    const index = parseInt(match[1]) - 1;
    const selectedImage = images[index];

    try {
      const imageStream = await getStreamFromURL(selectedImage, `selected_U${index + 1}.jpg`);
      message.reply({
        body: `Here is your selected image (U${index + 1}).`,
        attachment: imageStream,
      });
    } catch (error) {
      console.error(error);
      message.reply("Unable to retrieve the selected image. Please try again.");
    }
  },
};
