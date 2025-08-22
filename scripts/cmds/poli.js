const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const requestCache = {};
const userSelections = {};

module.exports = {
  config: {
    name: "polination",
    aliases: ["polin", "polinbot", "poli"],
    author: "Redwan",
    version: "1.5",
    cooldowns: 20,
    role: 2,
    shortDescription: "Craft visions with the seeds of imagination.",
    longDescription: "Let your thoughts bloom into vivid imagery through the power of AI.",
    category: "Image Generation",
    guide: "{p}poli <prompt>",
  },

  onStart: async function ({ message, args, api, event }) {
    const userId = event.senderID;
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage("❌ | Speak your vision, and let the seeds of creation grow.", event.threadID, event.messageID);
    }

    if (!canGenerateImage(userId)) {
      return api.sendMessage("❌ | You’ve planted two seeds already. Wait a while for new ones to sprout.", event.threadID, event.messageID);
    }

    api.setMessageReaction("⏰", event.messageID, (err) => {}, true);

    api.sendMessage("🌱 | Your creation is being nurtured... please be patient.", event.threadID, async (err, info) => {
      if (err) return;
      await generateCollage(prompt, message, api, event, info.messageID, userId);
    });
  },

  onReply: async function ({ event, api, replyData }) {
    const userId = event.senderID;
    const selection = parseInt(event.body.trim());

    if (!Number.isInteger(selection) || selection < 1 || selection > 4) {
      return api.sendMessage("❌ | Choose a number between 1 and 4 to select your bloom.", event.threadID, event.messageID);
    }

    if (!userSelections[userId]) {
      return api.sendMessage("❌ | You must first plant the seeds. Try generating a new image.", event.threadID, event.messageID);
    }

    const collagePath = userSelections[userId];

    api.sendMessage("🔍 | Enhancing the image you’ve chosen, nurturing its essence...", event.threadID, async (err, info) => {
      if (err) return;
      await upscaleAndSendImage(collagePath, selection, event, api);
    });
  },
};

async function generateCollage(prompt, message, api, event, waitMessageID, userId) {
  try {
    const apiUrl = `http://65.109.80.126:20511/api/api/poli?prompt=${encodeURIComponent(prompt)}`;
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    if (!response || !response.data || response.data.length === 0) {
      throw new Error("❌ | The garden of creation has failed to bloom. Try again.");
    }

    const cacheDir = path.resolve(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const collagePath = path.join(cacheDir, `${Date.now()}_poli_collage.png`);
    await fs.promises.writeFile(collagePath, response.data);

    const stream = fs.createReadStream(collagePath);

    api.unsendMessage(waitMessageID, (err) => {});
    api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    userSelections[userId] = collagePath;

    message.reply(
      {
        body: "🖼️ | Select which part of your vision to refine (1-4):\n\n1️⃣ Top-left\n2️⃣ Top-right\n3️⃣ Bottom-left\n4️⃣ Bottom-right",
        attachment: stream,
      },
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "polination",
          author: userId,
        });
      }
    );

    logRequest(userId);

    setTimeout(async () => {
      try {
        await fs.promises.unlink(collagePath);
      } catch (err) {
        console.error("❌ Error deleting file:", err);
      }
    }, 60000);
  } catch (error) {
    api.sendMessage("❌ | The winds of creation are not favorable today. Try again.", event.threadID, event.messageID);
  }
}

async function upscaleAndSendImage(collagePath, selection, event, api) {
  try {
    const image = await loadImage(collagePath);
    const canvasSize = image.width / 2;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext("2d");

    const positions = {
      1: { x: 0, y: 0 },
      2: { x: canvasSize, y: 0 },
      3: { x: 0, y: canvasSize },
      4: { x: canvasSize, y: canvasSize },
    };

    const { x, y } = positions[selection];

    ctx.drawImage(image, x, y, canvasSize, canvasSize, 0, 0, canvasSize, canvasSize);

    const upscalePath = collagePath.replace("_collage.png", `_upscaled_${selection}.png`);
    const buffer = canvas.toBuffer("image/png");
    await fs.promises.writeFile(upscalePath, buffer);

    const stream = fs.createReadStream(upscalePath);

    api.sendMessage(
      {
        body: "✨ | Your vision has been nurtured to its fullest bloom.",
        attachment: stream,
      },
      event.threadID,
      async () => {
        try {
          await fs.promises.unlink(upscalePath);
        } catch (err) {
          console.error("❌ Error deleting file:", err);
        }
      }
    );
  } catch (error) {
    api.sendMessage("❌ | The winds could not carry your request. Try again.", event.threadID, event.messageID);
  }
}

function canGenerateImage(userId) {
  const now = Date.now();
  if (!requestCache[userId]) requestCache[userId] = [];

  requestCache[userId] = requestCache[userId].filter((timestamp) => now - timestamp < 10 * 60 * 1000);

  return requestCache[userId].length < 2;
}

function logRequest(userId) {
  canGenerateImage(userId);
  requestCache[userId].push(Date.now());
                                               }
