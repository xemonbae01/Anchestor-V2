const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "Udo",
    version: "1.2",
    author: "Redwan",
    countDown: 0,
    longDescription: {
      en: "Create AI-generated images with your prompt."
    },
    category: "Image Generation",
    role: 0,
    guide: {
      en: "{pn} <prompt> [--ar <aspect_ratio>]"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    if (!this.checkAuthor()) {
      return message.reply("Unauthorized action.");
    }

    let prompt = args.join(' ').trim();
    let aspectRatio = "5:9"; 

    const arIndex = args.indexOf('--ar');
    if (arIndex !== -1 && args[arIndex + 1]) {
      aspectRatio = args[arIndex + 1];
      prompt = args.slice(0, arIndex).join(' ').trim();
    }

    if (!prompt) {
      return message.reply("Enter a prompt to generate an image.");
    }

    message.reply("Generating... Please wait.", async (err, info) => {
      if (err) return console.error(err);

      try {
        const apiUrl = `http://65.109.80.126:20511/api/generate-image?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(aspectRatio)}`;
        const response = await axios.get(apiUrl);

        if (response.data.status !== "success" || !response.data.image_link) {
          return message.reply("Image generation failed. Try again.");
        }

        const imageStream = await getStreamFromURL(response.data.image_link, 'generated_image.jpg');

        message.reply({
          body: `Here's your image for: "${prompt}" with aspect ratio: ${aspectRatio}`,
          attachment: imageStream,
        });

      } catch (error) {
        console.error(error);
        message.reply("Something went wrong. Try again later.");
      }
    });
  },

  checkAuthor: function () {
    return this.config.author === "Redwan";
  }
};
