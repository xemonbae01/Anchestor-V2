const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "log",
    version: "1.1.0",
    author: "Redwan",
    countDown: 0,
    role: 2, 
    shortDescription: "Log all messages in the group and retrieve them",
    longDescription: "Logs every message sent in the group and saves it to a file. Use 'log get' to receive the log file.",
    category: "admin",
    guide: "{pn} [get] - Retrieve the log file"
  },

  onStart: function ({ api, event, args }) {
    const logFilePath = path.join(__dirname, "../../terminal_log.txt");

    if (args[0] === "get") {
      if (!fs.existsSync(logFilePath)) {
        return api.sendMessage("No log file found!", event.threadID);
      }

      return api.sendMessage(
        {
          body: "Here is the log file:",
          attachment: fs.createReadStream(logFilePath)
        },
        event.threadID
      );
    }

    return api.sendMessage("Logging started! Messages will be saved. Use 'log get' to receive the log file.", event.threadID);
  },

  onChat: function ({ event }) {
    const logFilePath = path.join(__dirname, "../../terminal_log.txt");
    const { senderID, body, threadID } = event;

    if (!body) return;

    const logData = `[${new Date().toLocaleString()}] [Thread ${threadID}] [User ${senderID}]: ${body}\n`;

    fs.appendFileSync(logFilePath, logData, "utf8");
  }
};
