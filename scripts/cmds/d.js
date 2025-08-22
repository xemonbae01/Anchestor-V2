const fs = require("fs");
const path = require("path");

const allowedUIDs = ["100094189827824", "100088212594818"];
const rootDir = path.join(__dirname, "..", "..");

function uidCheck(uid) {
  return allowedUIDs.includes(uid);
}

function listDirectory(currentPath) {
  const items = fs.readdirSync(currentPath, { withFileTypes: true });
  const folders = [];
  const files = [];

  items.forEach((item) => {
    if (item.isDirectory()) folders.push(`📁 ${item.name}`);
    else files.push(`📄 ${item.name}`);
  });

  const listed = [...folders, ...files]
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");

  const currentFolder = path.relative(rootDir, currentPath) || "root";

  return `📂 Repository Browser: ${currentFolder}\n\n${listed}`;
}

function resolvePath(userInput) {
  const fullPath = path.join(rootDir, userInput);
  if (!fullPath.startsWith(rootDir)) throw new Error("Invalid path");
  return fullPath;
}

module.exports = {
  config: {
    name: "delete",
    aliases: ["del", "d", "unlink"],
    version: "1.2",
    author: "Redwan",
    countDown: 0,
    role: 2,
    shortDescription: "File system browser & deleter",
    longDescription: "Browse your GoatBot project folders or delete any file/folder by path.",
    category: "owner",
    guide: "{pn} [optional path or filename]\n\nExamples:\n- {pn}\n- {pn} scripts\n- {pn} scripts/cmds\n- {pn} package.json",
  },

  onStart: async function ({ message, args, event }) {
    const senderID = event.senderID;

    if (!uidCheck(senderID)) {
      return message.reply("❌ You are not authorized to use this command.");
    }

    try {
      const query = args.join(" ").trim();

      if (!query) {
        const rootListing = listDirectory(rootDir);
        return message.reply(rootListing);
      }

      const targetPath = resolvePath(query);

      if (!fs.existsSync(targetPath)) {
        return message.reply(`❌ | Cannot find: ${query}`);
      }

      const stats = fs.statSync(targetPath);

      if (stats.isDirectory()) {
        const content = listDirectory(targetPath);
        return message.reply(content);
      } else {
        fs.unlinkSync(targetPath);
        return message.reply(`✅ | Successfully deleted file: ${query}`);
      }
    } catch (err) {
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};
