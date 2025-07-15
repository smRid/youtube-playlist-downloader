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
        this.proxyHeaders = this.generateProxyHeaders();
    }

    // Enhanced proxy headers to mimic real browser behavior
    generateProxyHeaders() {
        return {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Dnt': '1',
            'Connection': 'keep-alive'
        };
    }

    // Method 1: User-Agent rotation with enhanced browser simulation
    getRandomUserAgent() {
        const agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
        ];
        return agents[Math.floor(Math.random() * agents.length)];
    }

    // Method 2: Enhanced random delay with jitter
    async randomDelay() {
        const baseDelay = Math.floor(Math.random() * 2000) + 500; // 0.5-2.5 seconds
        const jitter = Math.floor(Math.random() * 1000); // Add up to 1 second jitter
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
    }

    // Method 3: Try different YouTube endpoints with enhanced headers
    async tryAlternativeEndpoints(videoId) {
        for (const endpoint of this.alternativeEndpoints) {
            try {
                const response = await fetch(`${endpoint}${videoId}`, {
                    headers: {
                        ...this.proxyHeaders,
                        'User-Agent': this.getRandomUserAgent(),
                        'Referer': 'https://www.google.com/',
                        'X-Forwarded-For': this.getRandomIP(),
                        'X-Real-IP': this.getRandomIP(),
                        'X-Forwarded-Proto': 'https'
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

    // Method 4: Enhanced API approaches with multiple fallback strategies
    async tryDifferentAPIs(videoId) {
        const apiMethods = [
            // Method 1: Basic ytdl-core with enhanced headers
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            ...this.proxyHeaders,
                            'User-Agent': this.getRandomUserAgent(),
                            'Referer': 'https://www.youtube.com/',
                            'Origin': 'https://www.youtube.com'
                        }
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            // Method 2: With IP rotation simulation
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            ...this.proxyHeaders,
                            'User-Agent': this.getRandomUserAgent(),
                            'X-Forwarded-For': this.getRandomIP(),
                            'X-Real-IP': this.getRandomIP(),
                            'X-Forwarded-Proto': 'https',
                            'X-Forwarded-Host': 'www.youtube.com',
                            'Referer': 'https://www.google.com/'
                        }
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            // Method 3: Mobile user agent simulation
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Referer': 'https://m.youtube.com/'
                        }
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            // Method 4: With embedded player simulation
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            ...this.proxyHeaders,
                            'User-Agent': this.getRandomUserAgent(),
                            'Referer': `https://www.youtube.com/embed/${videoId}`,
                            'X-YouTube-Client-Name': '1',
                            'X-YouTube-Client-Version': '2.20231201.01.00'
                        }
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            // Method 5: Alternative with TV client simulation
            async () => {
                const ytdl = require('@distube/ytdl-core');
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/6.0 TV Safari/537.36',
                            'Accept': '*/*',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://www.youtube.com/'
                        }
                    },
                    cookies: this.generateSessionCookies()
                });
            }
        ];

        for (const method of apiMethods) {
            try {
                console.log(`Trying API method...`);
                await this.randomDelay();
                const result = await method();
                console.log(`API method succeeded`);
                return result;
            } catch (error) {
                console.log(`API method failed: ${error.message}`);
                continue;
            }
        }
        return null;
    }

    // Method 5: Generate realistic session cookies with modern format
    generateSessionCookies() {
        const cookies = {
            VISITOR_INFO1_LIVE: 'jMbkq7M8K_E',
            PREF: 'f1=50000000&f6=40000000&hl=en',
            GPS: '1',
            YSC: 'abc123def456',
            CONSENT: 'YES+cb.20210328-17-p0.en+FX+123',
            SOCS: 'CAESHAgBEhJnd3NfMjAyMzA0MjUtMF9SQzIaAmVuIAEaBgiA_LyaBg'
        };
        
        // Return as cookie object for modern ytdl-core
        return cookies;
    }

    // Method 6: Generate random IP for headers
    getRandomIP() {
        // Generate realistic IP ranges
        const ranges = [
            [8, 8, 8, 8], // Google DNS
            [1, 1, 1, 1], // Cloudflare
            [208, 67, 222, 222], // OpenDNS
            [64, 6, 64, 6], // Verisign
            [9, 9, 9, 9] // Quad9
        ];
        
        const baseRange = ranges[Math.floor(Math.random() * ranges.length)];
        return baseRange.map((octet, index) => {
            if (index < 2) return octet;
            return Math.floor(Math.random() * 256);
        }).join('.');
    }

    // Method 7: Enhanced main bypass method with better error handling
    async bypassYouTubeProtection(videoId) {
        console.log(`🔄 Attempting to bypass YouTube protection for video: ${videoId}`);
        
        // Try Method 1: Enhanced API approaches with full browser simulation
        try {
            console.log(`🔄 Trying enhanced API approaches...`);
            await this.randomDelay();
            const result = await this.tryDifferentAPIs(videoId);
            if (result) {
                console.log('✅ Bypass successful: Enhanced API approach');
                return result;
            }
        } catch (error) {
            console.log(`❌ Enhanced API approaches failed: ${error.message}`);
        }

        // Try Method 2: Alternative endpoints with enhanced headers
        try {
            console.log(`🔄 Trying alternative endpoints...`);
            await this.randomDelay();
            const endpoint = await this.tryAlternativeEndpoints(videoId);
            if (endpoint) {
                console.log(`✅ Bypass successful: Alternative endpoint ${endpoint}`);
                // Try to get info with the successful endpoint
                const ytdl = require('@distube/ytdl-core');
                const result = await ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            ...this.proxyHeaders,
                            'User-Agent': this.getRandomUserAgent(),
                            'Referer': endpoint
                        }
                    },
                    cookies: this.generateSessionCookies()
                });
                return result;
            }
        } catch (error) {
            console.log(`❌ Alternative endpoints failed: ${error.message}`);
        }

        // Try Method 3: Youtube-dl-exec as ultimate fallback
        try {
            console.log(`🔄 Trying youtube-dl-exec fallback...`);
            await this.randomDelay();
            const youtubeDl = require('youtube-dl-exec');
            const result = await youtubeDl(`https://www.youtube.com/watch?v=${videoId}`, {
                dumpSingleJson: true,
                noWarnings: true,
                userAgent: this.getRandomUserAgent(),
                addHeader: [
                    'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language:en-US,en;q=0.9',
                    'Accept-Encoding:gzip, deflate, br',
                    'DNT:1',
                    'Connection:keep-alive',
                    'Upgrade-Insecure-Requests:1'
                ]
            });
            if (result) {
                console.log('✅ Bypass successful: Youtube-dl-exec fallback');
                return result;
            }
        } catch (error) {
            console.log(`❌ Youtube-dl-exec fallback failed: ${error.message}`);
        }

        // Try Method 4: Direct extraction with minimal headers
        try {
            console.log(`🔄 Trying direct extraction...`);
            await this.randomDelay();
            const ytdl = require('@distube/ytdl-core');
            const result = await ytdl.getInfo(videoId);
            console.log('✅ Bypass successful: Direct extraction');
            return result;
        } catch (error) {
            console.log(`❌ Direct extraction failed: ${error.message}`);
        }

        console.log('❌ All bypass methods failed');
        return null;
    }
}

module.exports = YouTubeBypass;
