const axios = require("axios");

module.exports.config = {
  name: "tiks",
  category: "utilities",
  author: "Romim",
  description: "Retrieve TikTok user information",
};

module.exports.onStart = async function ({ api, event, args }) {
  try {
    const username = args[0]; 

    if (!username) {
      return api.sendMessage(
        "Please provide a TikTok username.\nUsage: /tiks <username>",
        event.threadID,
        event.messageID
      );
    }
    const tiktokApiUrl = `https://www.tikwm.com/api/user/info?unique_id=@${username}`;
    const response = await axios.get(tiktokApiUrl);
    const data = response.data.data;
    if (!data || !data.user) {
      return api.sendMessage(
        "No data found for the provided username. Please check the username.",
        event.threadID,
        event.messageID
      );
    }
    const userInfo = `👤 *TikTok User Info*\n\n` +
      `🔹 ID: ${data.user.id}\n` +
      `🔹 Nickname: ${data.user.nickname}\n` +
      `🔹 Username: ${data.user.uniqueId}\n` +
      `🔹 Signature: ${data.user.signature || "N/A"}\n` +
      `🔹 Verified: ${data.user.verified ? "Yes" : "No"}\n` +
      `🔹 Following: ${data.stats.followingCount}\n` +
      `🔹 Followers: ${data.stats.followerCount}\n` +
      `🔹 Hearts: ${data.stats.heartCount}\n` +
      `🔹 Videos: ${data.stats.videoCount}`;
    const avatarUrl = data.user.avatarLarger || data.user.avatarMedium || data.user.avatarThumb;
    api.sendMessage(
      {
        body: userInfo,
        attachment: await global.utils.getStreamFromUrl(avatarUrl),
      },
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("Error occurred:", error.message);
    api.sendMessage(
      "Something went wrong! Please try again later.",
      event.threadID,
      event.messageID
    );
  }
};
