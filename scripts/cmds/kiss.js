const DIG = require("discord-image-generation");
const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");

module.exports = {
	config: {
		name: "kiss",
		version: "1.2",
		author: "jun | Redwan",
		countDown: 5,
		role: 0,
		shortDescription: "Kiss another user",
		longDescription: "Send a kissing image with the mentioned user.",
		category: "image",
		guide: {
			en: "{pn} @tag"
		}
	},

	onStart: async function ({ event, message, usersData, args, api, getLang }) {
		try {
			const uid1 = event.senderID;
			const uid2 = Object.keys(event.mentions)[0];

			if (!uid2) return message.reply(getLang("noTag"));

			const userInfo1 = await api.getUserInfo(uid1);
			const userInfo2 = await api.getUserInfo(uid2);

			const gender1 = userInfo1.gender;
			const gender2 = userInfo2.gender;

			let avatarURL1 = await usersData.getAvatarUrl(uid1);
			let avatarURL2 = await usersData.getAvatarUrl(uid2);

			if (gender1 === 2 && gender2 === 1) {
				[avatarURL1, avatarURL2] = [avatarURL2, avatarURL1];
			}

			const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);

			const tmpDir = path.join(__dirname, "tmp");
			if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

			const pathSave = path.join(tmpDir, `${uid1}_${uid2}_Kiss.png`);
			fs.writeFileSync(pathSave, Buffer.from(img));

			const content = args.filter(arg => !event.mentions[arg]).join(" ") || "mwuahh 😘😘";

			await message.reply({
				body: content,
				attachment: fs.createReadStream(pathSave)
			});

			fs.unlinkSync(pathSave);

		} catch (error) {
			console.error("Error in kiss command:", error);
			message.reply("❌ An error occurred while generating the image.");
		}
	}
};
