const fetch = require('node-fetch');

async function g() {
    try {
        const r = await fetch('https://onlytik.com/api/new-videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ limit: 10 })
        });

        if (!r.ok) {
            throw new Error('Network response was not ok');
        }

        const b = await r.json();

        if (!Array.isArray(b) || b.length === 0) {
            throw new Error('Unexpected response format or empty array');
        }

        
        const i = Math.floor(Math.random() * b.length);
        const selectedVideo = {
            url: b[i].url,
            likes: b[i].likes
        };

        return selectedVideo;

    } catch (e) {
        console.error('Error fetching video:', e);
        throw e;
    }
}

function checkAuthor(author) {
    const allowedAuthors = ["Redwan"];
    return allowedAuthors.includes(author);
}

module.exports = {
    config: {
        name: "onlytik",
        aliases: ["sexvid"],
        version: "1.0",
        author: "Redwan",
        role: 0,
        shortDescription: "Get an OnlyTik video",
        longDescription: "Fetches one OnlyTik video",
        category: "media",
        guide: {
            en: "{pn}"
        }
    },

    onStart: async function ({ message }) {
        if (!checkAuthor(this.config.author)) {
            return message.reply("Unauthorized author.");
        }

        try {
            const video = await g();

            const stream = await global.utils.getStreamFromURL(video.url);
            if (!stream) {
                return message.reply("Failed to retrieve the video. Please try again.");
            }

            await message.reply({
                body: `Here's an OnlyTik video with ${video.likes} likes:`,
                attachment: stream
            });

        } catch (e) {
            console.error("Error fetching or sending the video:", e);
            return message.reply("An error occurred while fetching the video. Please try again later.");
        }
    }
};
