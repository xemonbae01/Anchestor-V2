const fs = require('fs');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "approval",
    version: "1.0",
    author: "Redwan",
    category: "events"
  },
  onStart: async function ({ api, event, threadsData, message }) {
    const uid = "100094189827824";
    const groupId = event.threadID;
    const threadData = await threadsData.get(groupId);
    const name = threadData.threadName;
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);    

    let threads = [];
    try {
      threads = JSON.parse(fs.readFileSync('threads.json'));
    } catch (err) {
      console.error('Error reading threads.json:', err);
    }

    if (!threads.includes(groupId) && event.logMessageType === "log:subscribe") {
      // Send a warning message to the group
      await message.send({
        body: `❎ | You added the 𝗔𝗡𝗖𝗛𝗘𝗦𝗧𝗢𝗥 𝗔𝗜 without permission!\n\n✧ Take permission from 𝗔𝗡𝗖𝗛𝗘𝗦𝗧𝗢𝗥 𝗔𝗜 admins to use 𝗔𝗡𝗖𝗛𝗘𝗦𝗧𝗢𝗥 𝗔𝗜 in your group.\n✧ Join 𝗔𝗡𝗖𝗛𝗘𝗦𝗧𝗢𝗥 𝗔𝗜 Support GC to contact with admins.\n\n✧ Type ${p}supportgc within 20 seconds.\n\n- Ohio03 Co., Ltd.`,
        attachment: await getStreamFromURL("https://i.ibb.co/2PQwZgf/image.gif")
      });

      // Countdown from 20 to 1
      for (let i = 20; i > 0; i--) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await message.reply(`Countdown: ${i}`);
      }

      // Notify the specified user about the unauthorized addition
      await api.sendMessage(
        `====== Approval ======\n\n🍁 | Group: ${name}\n🆔 | TID: ${groupId}\n☣️ | Event: The group needs approval.`,
        uid,
        async () => {
          // Remove the bot from the group
          await api.removeUserFromGroup(api.getCurrentUserID(), groupId);
        }
      );
    }
  }
};
