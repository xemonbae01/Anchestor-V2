const axios = require('axios');
const { createReadStream, writeFileSync, unlinkSync } = require('fs');

module.exports = {
	config: {
		name: 'fbcover',
		version: '1.1',
		author: 'Redwan',
		countDown: 5,
		role: 0,
		shortDescription: 'Create a Facebook banner',
		longDescription: 'Generates a Facebook cover using custom input.',
		category: 'Image Generation',
		guide: {
			en: '{p}{n} <name> | <subname> | <address> | <phone> | <email> | <color>',
		}
	},

	onStart: async function ({ message, args, event }) {
		const info = args.join(' ').split('|').map(i => i.trim());
		if (info.length < 6) {
			return message.reply(`Please enter all 6 details:\n/fbcover name | subname | address | phone | email | color`);
		}

		const [name, subname, address, phoneNumber, email, color] = info;

		await message.reply('Processing your cover, senpai...❤️');

		try {
			const url = `65.109.80.126:20511/api/fbcoverv1?name=${encodeURIComponent(name)}&uid=${event.senderID}&address=${encodeURIComponent(address)}&email=${encodeURIComponent(email)}&subname=${encodeURIComponent(subname)}&phoneNumber=${encodeURIComponent(phoneNumber)}&color=${encodeURIComponent(color)}`;

			const res = await axios.get(url, { responseType: 'arraybuffer' });

			const path = __dirname + `/fbcover_${event.senderID}.png`;
			writeFileSync(path, Buffer.from(res.data, 'binary'));

			await message.reply({
				body: '「 Your cover is ready, senpai! ❤️‍🔥 」',
				attachment: createReadStream(path)
			});

			unlinkSync(path);
		} catch (err) {
			console.error(err);
			message.reply('Something went wrong while generating your cover. Please try again later.');
		}
	}
};
