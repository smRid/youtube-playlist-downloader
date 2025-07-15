const fetch = require('node-fetch');
const UserAgent = require('user-agents');

class YouTubeBypass {
    constructor() {
        this.userAgent = new UserAgent();
        this.alternativeEndpoints = [
            'https://www.youtube.com/watch?v=',
            'https://m.youtube.com/watch?v=',
            'https://youtube.com/watch?v=',
            'https://www.youtube-nocookie.com/watch?v='
        ];
    }

    // Method 1: User-Agent rotation
    getRandomUserAgent() {
        return this.userAgent.random().toString();
    }

    // Method 2: Random delay to avoid being flagged
    async randomDelay() {
        const delay = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Method 3: Try different YouTube endpoints
    async tryAlternativeEndpoints(videoId) {
        for (const endpoint of this.alternativeEndpoints) {
            try {
                const response = await fetch(`${endpoint}${videoId}`, {
                    headers: {
                        'User-Agent': this.getRandomUserAgent(),
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });
                
                if (response.ok) {
                    return endpoint;
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }

    // Method 4: Try different API approaches
    async tryDifferentAPIs(videoId) {
        const apiMethods = [
            // Method 1: Direct ytdl-core
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId);
            },
            // Method 2: With custom agent
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            'User-Agent': this.getRandomUserAgent()
                        }
                    }
                });
            },
            // Method 3: With proxy-like headers
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            'User-Agent': this.getRandomUserAgent(),
                            'X-Forwarded-For': this.getRandomIP(),
                            'X-Real-IP': this.getRandomIP(),
                            'Referer': 'https://www.youtube.com/'
                        }
                    }
                });
            },
            // Method 4: With session cookies simulation
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            'User-Agent': this.getRandomUserAgent(),
                            'Cookie': 'VISITOR_INFO1_LIVE=jMbkq7M8K_E; PREF=f1=50000000; GPS=1',
                            'Referer': 'https://www.youtube.com/',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                        }
                    }
                });
            }
        ];

        for (const method of apiMethods) {
            try {
                await this.randomDelay();
                return await method();
            } catch (error) {
                console.log(`API method failed: ${error.message}`);
                continue;
            }
        }
        return null;
    }

    // Method 5: Generate random IP for headers
    getRandomIP() {
        return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
    }

    // Method 6: Main bypass method that tries all approaches
    async bypassYouTubeProtection(videoId) {
        console.log(`Attempting to bypass YouTube protection for video: ${videoId}`);
        
        // Try Method 1: Simple user-agent rotation
        try {
            await this.randomDelay();
            const result = await this.tryDifferentAPIs(videoId);
            if (result) {
                console.log('Bypass successful: User-agent rotation');
                return result;
            }
        } catch (error) {
            console.log('User-agent rotation failed:', error.message);
        }

        // Try Method 2: Alternative endpoints with different user agents
        try {
            await this.randomDelay();
            const endpoint = await this.tryAlternativeEndpoints(videoId);
            if (endpoint) {
                console.log(`Bypass successful: Alternative endpoint ${endpoint}`);
                // Try to get info with the successful endpoint
                const ytdl = require('@distube/ytdl-core');
                const result = await ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            'User-Agent': this.getRandomUserAgent(),
                            'Referer': endpoint
                        }
                    }
                });
                return result;
            }
        } catch (error) {
            console.log('Alternative endpoints failed:', error.message);
        }

        console.log('All bypass methods failed');
        return null;
    }
}

module.exports = YouTubeBypass;
