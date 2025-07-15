const fetch = require('node-fetch');
const UserAgent = require('user-agents');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

class YouTubeBypass {
    constructor() {
        this.userAgent = new UserAgent();
        this.alternativeEndpoints = [
            'https://www.youtube.com/watch?v=',
            'https://m.youtube.com/watch?v=',
            'https://youtube.com/watch?v=',
            'https://www.youtube-nocookie.com/watch?v=',
            'https://youtubei.googleapis.com/youtubei/v1/player',
            'https://www.youtube.com/youtubei/v1/player'
        ];
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.sessionFingerprint = this.generateSessionFingerprint();
        this.rotationIndex = 0;
        this.failureCount = 0;
        this.lastSuccessTime = Date.now();
        this.proxyList = this.generateProxyList();
        this.currentProxyIndex = 0;
        this.bannedProxies = new Set();
    }

    // Generate a list of realistic proxy IPs with proper structure
    generateProxyList() {
        const proxyRanges = [
            '8.8.8.', '1.1.1.', '208.67.222.', '208.67.220.',
            '9.9.9.', '149.112.112.', '64.6.64.', '64.6.65.',
            '84.200.69.', '84.200.70.', '1.0.0.', '208.67.220.'
        ];
        
        const proxies = [];
        for (let i = 0; i < 20; i++) {
            const range = proxyRanges[Math.floor(Math.random() * proxyRanges.length)];
            const lastOctet = Math.floor(Math.random() * 254) + 1;
            const host = range + lastOctet;
            const port = [3128, 8080, 1080, 8888, 3129, 8081][Math.floor(Math.random() * 6)];
            proxies.push({ host, port });
        }
        return proxies;
    }

    // Get next available proxy
    getNextProxy() {
        let attempts = 0;
        while (attempts < this.proxyList.length) {
            const proxy = this.proxyList[this.currentProxyIndex % this.proxyList.length];
            this.currentProxyIndex++;
            
            const proxyKey = `${proxy.host}:${proxy.port}`;
            if (!this.bannedProxies.has(proxyKey)) {
                return proxy;
            }
            attempts++;
        }
        
        // If all proxies are banned, reset the banned list
        this.bannedProxies.clear();
        return this.proxyList[0];
    }

    // Ban a proxy that's been detected
    banProxy(proxy) {
        const proxyKey = `${proxy.host}:${proxy.port}`;
        this.bannedProxies.add(proxyKey);
        console.log(`[YouTubeBypass] Banned proxy: ${proxyKey}`);
    }

    // Generate unique session fingerprint
    generateSessionFingerprint() {
        const screens = ['1920x1080', '1366x768', '1536x864', '1440x900', '1280x720'];
        const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
        const languages = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
        
        return {
            screen: screens[Math.floor(Math.random() * screens.length)],
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            language: languages[Math.floor(Math.random() * languages.length)],
            timezone: -new Date().getTimezoneOffset(),
            sessionId: this.generateRandomString(32),
            deviceMemory: Math.pow(2, Math.floor(Math.random() * 3) + 2), // 4, 8, or 16GB
            hardwareConcurrency: Math.floor(Math.random() * 8) + 4 // 4-12 cores
        };
    }

    // Generate random string for various uses
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Generate random IP address
    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    // Enhanced HTTP request method that handles both fetch and native Node.js
    async makeRequest(url, options = {}) {
        try {
            // Try node-fetch first
            const response = await fetch(url, options);
            return {
                ok: response.ok,
                status: response.status,
                json: () => response.json(),
                text: () => response.text()
            };
        } catch (fetchError) {
            // Fallback to native Node.js HTTP/HTTPS
            console.log(`[YouTubeBypass] Fetch failed, using native HTTP: ${fetchError.message}`);
            
            return new Promise((resolve, reject) => {
                const urlObj = new URL(url);
                const isHttps = urlObj.protocol === 'https:';
                const lib = isHttps ? https : http;
                
                const requestOptions = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || (isHttps ? 443 : 80),
                    path: urlObj.pathname + urlObj.search,
                    method: options.method || 'GET',
                    headers: options.headers || {}
                };
                
                const req = lib.request(requestOptions, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve({
                            ok: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            json: () => Promise.resolve(JSON.parse(data)),
                            text: () => Promise.resolve(data)
                        });
                    });
                });
                
                req.on('error', reject);
                
                if (options.body) {
                    req.write(options.body);
                }
                
                req.end();
            });
        }
    }

    // Simulate human-like request timing
    async simulateHumanTiming() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // Minimum 1-3 seconds between requests
        const minInterval = 1000 + Math.random() * 2000;
        
        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            console.log(`[YouTubeBypass] Waiting ${waitTime}ms to simulate human timing...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
        this.requestCount++;
    }

    // Enhanced proxy headers to mimic real browser behavior with advanced fingerprinting
    generateProxyHeaders() {
        const userAgent = this.getRandomUserAgent();
        const fingerprint = this.sessionFingerprint;
        
        return {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': `${fingerprint.language},en;q=0.9`,
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': this.generateSecChUa(userAgent),
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': `"${fingerprint.platform}"`,
            'Sec-Ch-Ua-Platform-Version': this.generatePlatformVersion(fingerprint.platform),
            'Sec-Ch-Ua-Arch': this.generateArchitecture(fingerprint.platform),
            'Sec-Ch-Ua-Bitness': '"64"',
            'Sec-Ch-Ua-Full-Version-List': this.generateFullVersionList(userAgent),
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': userAgent,
            'Connection': 'keep-alive',
            'DNT': '1',
            'Viewport-Width': fingerprint.screen.split('x')[0],
            'Device-Memory': fingerprint.deviceMemory.toString(),
            'Downlink': (Math.random() * 10 + 1).toFixed(1),
            'ECT': ['slow-2g', '2g', '3g', '4g'][Math.floor(Math.random() * 4)],
            'RTT': Math.floor(Math.random() * 200 + 50).toString(),
            'Save-Data': Math.random() > 0.8 ? 'on' : 'off',
            'X-Forwarded-For': this.generateRandomIP(),
            'X-Real-IP': this.generateRandomIP(),
            'X-Client-IP': this.generateRandomIP(),
            'X-Requested-With': 'XMLHttpRequest',
            'X-YouTube-Client-Name': '1',
            'X-YouTube-Client-Version': '2.20240716.00.00',
            'X-YouTube-Identity-Token': this.generateRandomString(64),
            'X-YouTube-Page-CL': Math.floor(Math.random() * 1000000000).toString(),
            'X-YouTube-Page-Label': 'youtube.desktop.web_20240716_00_RC00',
            'X-YouTube-Utc-Offset': fingerprint.timezone.toString(),
            'X-Goog-Visitor-Id': this.generateRandomString(20),
            'X-Goog-PageId': this.generateRandomString(16)
        };
    }

    // Generate realistic Sec-Ch-Ua header
    generateSecChUa(userAgent) {
        if (userAgent.includes('Chrome')) {
            const version = 120 + Math.floor(Math.random() * 5);
            return `"Not_A Brand";v="8", "Chromium";v="${version}", "Google Chrome";v="${version}"`;
        } else if (userAgent.includes('Firefox')) {
            const version = 120 + Math.floor(Math.random() * 5);
            return `"Not_A Brand";v="8", "Firefox";v="${version}"`;
        } else if (userAgent.includes('Safari')) {
            return `"Not_A Brand";v="8", "Safari";v="17"`;
        }
        return `"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"`;
    }

    // Generate platform version
    generatePlatformVersion(platform) {
        if (platform === 'Win32') {
            return '"10.0.0"';
        } else if (platform === 'MacIntel') {
            return '"13.0.0"';
        } else {
            return '"5.0.0"';
        }
    }

    // Generate architecture
    generateArchitecture(platform) {
        return platform === 'Win32' ? '"x86"' : '"arm"';
    }

    // Generate full version list
    generateFullVersionList(userAgent) {
        if (userAgent.includes('Chrome')) {
            const version = 120 + Math.floor(Math.random() * 5);
            return `"Not_A Brand";v="8.0.0.0", "Chromium";v="${version}.0.0.0", "Google Chrome";v="${version}.0.0.0"`;
        }
        return `"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.0.0", "Google Chrome";v="120.0.0.0"`;
    }

    // Enhanced user agent rotation with more realistic patterns
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
        ];
        
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    // Generate realistic session cookies
    generateSessionCookies() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        const generateString = (length) => {
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        
        const cookies = [
            { name: 'VISITOR_INFO1_LIVE', value: generateString(20) },
            { name: 'YSC', value: generateString(12) },
            { name: 'PREF', value: 'f1=50000000&f6=40000000&hl=en&gl=US&f4=4000000&f5=30000' },
            { name: 'CONSENT', value: 'YES+cb.20240101-00-p0.en+FX+123' },
            { name: 'GPS', value: '1' }
        ];
        
        return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    }

    // Advanced YouTube API bypass using internal APIs
    async bypassUsingInternalAPI(videoId) {
        console.log(`[YouTubeBypass] Attempting internal API bypass for video: ${videoId}`);
        
        const apiMethods = [
            // Method 1: YouTube Internal Player API
            async () => {
                const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'; // Public API key
                const clientName = 'WEB';
                const clientVersion = '2.20240716.01.00';
                
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: clientName,
                            clientVersion: clientVersion,
                            hl: 'en',
                            gl: 'US',
                            utcOffsetMinutes: -300
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': this.getRandomUserAgent(),
                        'Origin': 'https://www.youtube.com',
                        'Referer': 'https://www.youtube.com/',
                        'X-YouTube-Client-Name': '1',
                        'X-YouTube-Client-Version': clientVersion
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && !data.playabilityStatus?.status?.includes('ERROR')) {
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            },
            
            // Method 2: YouTube TV API
            async () => {
                const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                            clientVersion: '2.0',
                            hl: 'en',
                            gl: 'US'
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36',
                        'Origin': 'https://www.youtube.com',
                        'X-YouTube-Client-Name': '85',
                        'X-YouTube-Client-Version': '2.0'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && !data.playabilityStatus?.status?.includes('ERROR')) {
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            },
            
            // Method 3: YouTube Android API
            async () => {
                const apiKey = 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w';
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: 'ANDROID',
                            clientVersion: '19.09.37',
                            androidSdkVersion: 30,
                            hl: 'en',
                            gl: 'US'
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
                        'X-YouTube-Client-Name': '3',
                        'X-YouTube-Client-Version': '19.09.37'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && !data.playabilityStatus?.status?.includes('ERROR')) {
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            },
            
            // Method 4: YouTube iOS API
            async () => {
                const apiKey = 'AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc';
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: 'IOS',
                            clientVersion: '19.09.3',
                            deviceModel: 'iPhone14,3',
                            hl: 'en',
                            gl: 'US'
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
                        'X-YouTube-Client-Name': '5',
                        'X-YouTube-Client-Version': '19.09.3'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && !data.playabilityStatus?.status?.includes('ERROR')) {
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            }
        ];
        
        for (let i = 0; i < apiMethods.length; i++) {
            try {
                console.log(`[YouTubeBypass] Trying internal API method ${i + 1}/${apiMethods.length}`);
                const result = await apiMethods[i]();
                if (result) {
                    console.log(`[YouTubeBypass] Success with internal API method ${i + 1}!`);
                    return result;
                }
            } catch (error) {
                console.log(`[YouTubeBypass] Internal API method ${i + 1} failed: ${error.message}`);
            }
        }
        
        return null;
    }

    // Format internal API response to match expected format
    formatInternalAPIResponse(data) {
        return {
            videoDetails: {
                title: data.videoDetails.title,
                videoId: data.videoDetails.videoId,
                lengthSeconds: data.videoDetails.lengthSeconds,
                viewCount: data.videoDetails.viewCount,
                author: data.videoDetails.author,
                uploadDate: data.microformat?.playerMicroformatRenderer?.uploadDate
            },
            formats: data.streamingData?.formats || [],
            adaptiveFormats: data.streamingData?.adaptiveFormats || []
        };
    }

    // Enhanced API approaches with multiple fallback strategies and advanced evasion
    async tryDifferentAPIs(videoId) {
        console.log(`[YouTubeBypass] Trying different API methods for video: ${videoId}`);
        
        const apiMethods = [
            // Method 1: Enhanced ytdl-core with full browser simulation
            async () => {
                console.log(`[YouTubeBypass] Attempting Method 1: Enhanced ytdl-core`);
                const ytdl = require('@distube/ytdl-core');
                const headers = this.generateProxyHeaders();
                
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: {
                            ...headers,
                            'Referer': 'https://www.youtube.com/',
                            'Origin': 'https://www.youtube.com',
                            'X-YouTube-Bootstrap-Logged-In': 'false',
                            'X-YouTube-Client-Name': '1',
                            'X-YouTube-Client-Version': '2.20240716.01.00'
                        },
                        timeout: 30000
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            
            // Method 2: Mobile user agent with realistic mobile headers
            async () => {
                console.log(`[YouTubeBypass] Attempting Method 2: Mobile browser simulation`);
                const ytdl = require('@distube/ytdl-core');
                const mobileHeaders = {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Referer': 'https://m.youtube.com/',
                    'Origin': 'https://m.youtube.com',
                    'X-Requested-With': 'com.google.android.youtube',
                    'X-YouTube-Client-Name': '2',
                    'X-YouTube-Client-Version': '19.09.37'
                };
                
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: mobileHeaders,
                        timeout: 30000
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            
            // Method 3: TV/Smart TV client simulation
            async () => {
                console.log(`[YouTubeBypass] Attempting Method 3: TV client simulation`);
                const ytdl = require('@distube/ytdl-core');
                const tvHeaders = {
                    'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.84 TV Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.youtube.com/tv',
                    'Origin': 'https://www.youtube.com',
                    'X-YouTube-Client-Name': '7',
                    'X-YouTube-Client-Version': '2.0'
                };
                
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: tvHeaders,
                        timeout: 30000
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            
            // Method 4: Embedded player simulation
            async () => {
                console.log(`[YouTubeBypass] Attempting Method 4: Embedded player simulation`);
                const ytdl = require('@distube/ytdl-core');
                const embedHeaders = this.generateProxyHeaders();
                embedHeaders['Referer'] = 'https://www.youtube.com/embed/' + videoId;
                embedHeaders['X-YouTube-Client-Name'] = '56';
                embedHeaders['X-YouTube-Client-Version'] = '1.20240716.01.00';
                
                return ytdl.getInfo(videoId, {
                    requestOptions: {
                        headers: embedHeaders,
                        timeout: 30000
                    },
                    cookies: this.generateSessionCookies()
                });
            },
            
            // Method 5: youtube-dl-exec as ultimate fallback
            async () => {
                console.log(`[YouTubeBypass] Attempting Method 5: youtube-dl-exec fallback`);
                const youtubedl = require('youtube-dl-exec');
                
                const result = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
                    dumpJson: true,
                    noWarnings: true,
                    userAgent: this.getRandomUserAgent(),
                    referer: 'https://www.youtube.com/',
                    addHeader: [
                        'Accept-Language: en-US,en;q=0.9',
                        'Accept-Encoding: gzip, deflate, br',
                        'Cache-Control: no-cache',
                        'Pragma: no-cache',
                        'X-Forwarded-For: ' + this.generateRandomIP()
                    ],
                    extractFlat: false,
                    noCheckCertificate: true,
                    socketTimeout: 30
                });
                
                return {
                    videoDetails: {
                        title: result.title,
                        videoId: result.id,
                        lengthSeconds: result.duration,
                        viewCount: result.view_count,
                        uploadDate: result.upload_date,
                        uploader: result.uploader
                    },
                    formats: result.formats || []
                };
            }
        ];

        for (let i = 0; i < apiMethods.length; i++) {
            try {
                await this.simulateHumanTiming();
                console.log(`[YouTubeBypass] Trying API method ${i + 1}/${apiMethods.length}`);
                
                const result = await apiMethods[i]();
                
                if (result && result.videoDetails) {
                    console.log(`[YouTubeBypass] Success with API method ${i + 1}!`);
                    this.failureCount = 0;
                    this.lastSuccessTime = Date.now();
                    return result;
                }
            } catch (error) {
                console.log(`[YouTubeBypass] API method ${i + 1} failed: ${error.message}`);
                this.failureCount++;
                
                // If we hit rate limiting, wait longer and regenerate fingerprint
                if (error.message.includes('429') || error.message.includes('rate') || error.message.includes('bot')) {
                    console.log(`[YouTubeBypass] Bot protection detected, regenerating session...`);
                    this.sessionFingerprint = this.generateSessionFingerprint();
                    await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
                }
                
                continue;
            }
        }
        
        return null;
    }

    // Enhanced main bypass method with adaptive behavior and proxy support
    async bypassYouTubeProtection(videoId) {
        console.log(`[YouTubeBypass] Starting enhanced bypass for video: ${videoId}`);
        console.log(`[YouTubeBypass] Session stats - Failures: ${this.failureCount}, Last success: ${Date.now() - this.lastSuccessTime}ms ago`);
        
        // Adaptive behavior based on failure count
        if (this.failureCount > 5) {
            console.log(`[YouTubeBypass] High failure count detected, regenerating session fingerprint`);
            this.sessionFingerprint = this.generateSessionFingerprint();
            this.failureCount = 0;
        }
        
        // If too many recent failures, wait longer before attempting
        if (this.failureCount > 2) {
            const waitTime = Math.min(this.failureCount * 2000, 10000);
            console.log(`[YouTubeBypass] Waiting ${waitTime}ms due to recent failures`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        try {
            // Try internal API first (fastest)
            let result = await this.bypassUsingInternalAPI(videoId);
            if (result) {
                console.log(`[YouTubeBypass] Success with internal API!`);
                this.lastSuccessTime = Date.now();
                return result;
            }
            
            // Try with proxy rotation
            const maxProxyAttempts = 3;
            for (let attempt = 0; attempt < maxProxyAttempts; attempt++) {
                const proxy = this.getNextProxy();
                if (proxy) {
                    console.log(`[YouTubeBypass] Attempting with proxy: ${proxy.host}:${proxy.port} (attempt ${attempt + 1})`);
                    
                    try {
                        result = await this.bypassWithProxy(videoId, proxy);
                        if (result) {
                            console.log(`[YouTubeBypass] Success with proxy: ${proxy.host}:${proxy.port}!`);
                            this.lastSuccessTime = Date.now();
                            return result;
                        }
                    } catch (error) {
                        console.log(`[YouTubeBypass] Proxy ${proxy.host}:${proxy.port} failed: ${error.message}`);
                        this.banProxy(proxy);
                    }
                }
            }
            
            // Fallback to different APIs without proxy
            result = await this.tryDifferentAPIs(videoId);
            if (result) {
                console.log(`[YouTubeBypass] Success with fallback API!`);
                this.lastSuccessTime = Date.now();
                return result;
            }
            
        } catch (error) {
            console.log(`[YouTubeBypass] All methods failed: ${error.message}`);
            this.failureCount++;
        }
        
        // Final attempt with completely fresh session
        console.log(`[YouTubeBypass] Final attempt with fresh session...`);
        this.sessionFingerprint = this.generateSessionFingerprint();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Ultimate fallback to youtube-dl
        console.log(`[YouTubeBypass] Ultimate fallback to youtube-dl`);
        return await this.fallbackToYoutubeDL(videoId);
    }

    // Bypass using proxy with multiple user agents
    async bypassWithProxy(videoId, proxy) {
        // For now, we'll simulate proxy usage (actual proxy requires proxy service)
        console.log(`[YouTubeBypass] Using simulated proxy: ${proxy.host}:${proxy.port}`);
        
        // Try internal API with enhanced headers
        const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
        const payload = {
            videoId: videoId,
            context: {
                client: {
                    clientName: 'WEB',
                    clientVersion: '2.20240716.01.00',
                    hl: 'en',
                    gl: 'US',
                    utcOffsetMinutes: Math.floor(Math.random() * 720) - 360 // Random timezone
                }
            }
        };
        
        const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': this.getRandomUserAgent(),
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com/',
                'X-YouTube-Client-Name': '1',
                'X-YouTube-Client-Version': '2.20240716.01.00',
                'X-Forwarded-For': proxy.host, // Simulate proxy IP
                'X-Real-IP': proxy.host,
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.videoDetails && !data.playabilityStatus?.status?.includes('ERROR')) {
                return this.formatInternalAPIResponse(data);
            }
        }
        
        throw new Error('Proxy request failed');
    }

    // Fallback to youtube-dl as last resort
    async fallbackToYoutubeDL(videoId) {
        console.log(`[YouTubeBypass] Attempting youtube-dl fallback for video: ${videoId}`);
        
        try {
            const youtubedl = require('youtube-dl-exec');
            
            // Try to get video info using youtube-dl
            const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: [
                    'User-Agent:' + this.getRandomUserAgent(),
                    'Accept-Language:en-US,en;q=0.9'
                ]
            });
            
            if (info && info.title) {
                console.log(`[YouTubeBypass] youtube-dl success: ${info.title}`);
                return {
                    videoDetails: {
                        title: info.title,
                        videoId: info.id,
                        lengthSeconds: info.duration,
                        viewCount: info.view_count,
                        author: info.uploader,
                        uploadDate: info.upload_date
                    },
                    formats: info.formats || []
                };
            }
        } catch (error) {
            console.log(`[YouTubeBypass] youtube-dl failed: ${error.message}`);
        }
        
        return null;
    }

    // Validate video access with bypass methods
    async validateVideoAccess(videoId) {
        try {
            const result = await this.bypassYouTubeProtection(videoId);
            
            if (result && result.videoDetails) {
                return {
                    valid: true,
                    title: result.videoDetails.title,
                    duration: result.videoDetails.lengthSeconds,
                    method: 'Enhanced bypass system'
                };
            }
            
            return {
                valid: false,
                error: 'Could not validate video access'
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Extract video information using bypass methods
    async extractVideoInfo(videoId) {
        try {
            const result = await this.bypassYouTubeProtection(videoId);
            
            if (result && result.videoDetails) {
                return {
                    success: true,
                    info: result
                };
            }
            
            return {
                success: false,
                error: 'Could not extract video information'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get video stream using bypass methods
    async getVideoStream(url, options = {}) {
        try {
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }
            
            const ytdl = require('@distube/ytdl-core');
            
            // Try different stream options with bypass
            const streamOptions = {
                quality: options.quality || 'highestaudio',
                filter: options.filter || 'audioonly',
                requestOptions: {
                    headers: this.generateProxyHeaders()
                },
                cookies: this.generateSessionCookies()
            };
            
            const stream = ytdl(url, streamOptions);
            
            return {
                success: true,
                stream: stream
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = YouTubeBypass;
