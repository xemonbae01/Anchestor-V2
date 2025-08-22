const { exec } = require('child_process');

const allowedUIDs = ["100094189827824","100088212594818"]; 

module.exports = {
  config: {
    name: "sh",
    aliases: ['$', '>'],
    version: "1.0",
    author: "Redwan",
    countDown: 5, 
    role: 2,
    shortDescription: "Execute anything using terminal sh commands",
    longDescription: "",
    category: "shell",
    guide: {
      vi: "{p}{n} <command>",
      en: "{p}{n} <command>"
    }
  },

  onStart: async function ({ args, message, event }) {
    const command = args.join(" ");
    const senderID = event.senderID;

    function uidCheck(uid) {
      return allowedUIDs.includes(uid);
    }

    if (!uidCheck(senderID)) {
      return message.reply("❌ You are not authorized to use this command.");
    }

    if (!command) {
      return message.reply("⚠️ Please provide a command to execute.");
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        return message.reply(`❌ An error occurred: ${error.message}`);
      }

      if (stderr) {
        console.error(`Execution error: ${stderr}`);
        return message.reply(`⚠️ Error output: ${stderr}`);
      }

      console.log(`Command executed successfully:\n${stdout}`);
      message.reply(`✅ Command executed successfully:\n${stdout}`);
    });
  }
};
