const fs = require('fs');
const https = require('https');

const files = [
    {
        url: 'https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3',
        dest: 'frontend/public/assets/sounds/notification.mp3'
    },
    {
        url: 'https://assets.mixkit.co/sfx/preview/mixkit-airport-announcement-ding-1569.mp3',
        dest: 'frontend/public/assets/sounds/announcement.mp3'
    }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        https.get(url, options, (response) => {
            if (response.statusCode !== 200) {
                // Handle redirects if necessary, but mixkit usually serves directly or 302s.
                // If 302, we need to follow it.
                if (response.statusCode === 302 || response.statusCode === 301) {
                    download(response.headers.location, dest).then(resolve).catch(reject);
                    return;
                }
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`Downloaded ${dest}`);
                    resolve();
                });
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

const main = async () => {
    try {
        const dir = 'frontend/public/assets/sounds';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        for (const file of files) {
            await download(file.url, file.dest);
        }
        console.log('All files downloaded successfully.');
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

main();
