const fs = require("fs-extra");

const allowedUIDs = ["100094189827824", "100088212594818"];
const autoRestartFile = `${__dirname}/tmp/autorestart.txt`;
const restartCountFile = `${__dirname}/tmp/restartCount.json`;
const restartInterval = 3 * 60 * 60 * 1000;

function isAuthorized(uid) {
	return allowedUIDs.includes(uid);
}

function isAutoRestartEnabled() {
	return fs.existsSync(autoRestartFile) && fs.readFileSync(autoRestartFile, "utf-8") === "on";
}

function setAutoRestart(state) {
	fs.writeFileSync(autoRestartFile, state);
}

function getRestartCount() {
	if (!fs.existsSync(restartCountFile)) {
		return { manual: 0, auto: 0 };
	}
	return JSON.parse(fs.readFileSync(restartCountFile, "utf-8"));
}

function updateRestartCount(type) {
	const count = getRestartCount();
	count[type]++;
	fs.writeFileSync(restartCountFile, JSON.stringify(count, null, 2));
}

module.exports = {
	config: {
		name: "restart",
		version: "3.1",
		author: "Redwan",
		countDown: 5,
		role: 2,
		shortDescription: "Restart the bot",
		longDescription: "Allows you to restart the bot manually or enable/disable automatic restart.",
		category: "Owner",
		guide: "{pn}: Restart bot\n{pn} autorestart on/off: Enable or disable auto-restart\n{pn} list: Show restart history"
	},

	langs: {
		en: {
			restartting: "🔄 | Restarting bot...",
			autoRestart: "🕒 | The bot will automatically restart every 3 hours.",
			autoRestarting: "🔄 | Auto-restarting bot...",
			notAuthorized: "❌ | You are not authorized to use this command!",
			autoRestartEnabled: "✅ | Auto-restart has been enabled!",
			autoRestartDisabled: "❌ | Auto-restart has been disabled!",
			restartCount: "📊 | Restart history:\nManually: %1 times\nAutomatically: %2 times"
		}
	},

	onLoad: function ({ api }) {
		const pathFile = `${__dirname}/tmp/restart.txt`;
		if (fs.existsSync(pathFile)) {
			const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
			api.sendMessage(`✅ | Bot restarted successfully!\n⏰ | Time taken: ${(Date.now() - time) / 1000}s`, tid);
			fs.unlinkSync(pathFile);
		}

		if (isAutoRestartEnabled()) {
			setInterval(() => {
				console.log("🔄 | Auto-restarting bot...");
				api.sendMessage("🔄 | Auto-restarting bot...", "YOUR_THREAD_ID");
				updateRestartCount("auto");
				process.exit(2);
			}, restartInterval);
		}
	},

	onStart: async function ({ message, event, args, getLang }) {
		const senderID = event.senderID;

		if (!isAuthorized(senderID)) {
			return message.reply(getLang("notAuthorized"));
		}

		if (args[0] === "autorestart") {
			if (args[1] === "on") {
				setAutoRestart("on");
				return message.reply(getLang("autoRestartEnabled"));
			} else if (args[1] === "off") {
				setAutoRestart("off");
				return message.reply(getLang("autoRestartDisabled"));
			}
		}

		if (args[0] === "list") {
			const count = getRestartCount();
			return message.reply(getLang("restartCount", count.manual, count.auto));
		}

		const pathFile = `${__dirname}/tmp/restart.txt`;
		fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);
		updateRestartCount("manual");
		await message.reply(getLang("restartting"));
		process.exit(2);
	}
};
