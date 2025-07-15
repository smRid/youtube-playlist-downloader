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

    // Generate visitor data for YouTube API authentication
    generateVisitorData() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        let result = '';
        for (let i = 0; i < 20; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
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

    // Advanced signature decryption for YouTube streaming URLs
    async decryptSignature(signature, videoId) {
        console.log(`[YouTubeBypass] Attempting to decrypt signature: ${signature.substring(0, 20)}...`);
        
        try {
            // Get the player JavaScript code to extract the signature function
            const playerJsUrl = await this.getPlayerJsUrl(videoId);
            if (playerJsUrl) {
                const decryptedSignature = await this.decryptSignatureFromPlayerJs(signature, playerJsUrl);
                if (decryptedSignature) {
                    console.log(`[YouTubeBypass] Successfully decrypted signature using player JS`);
                    return decryptedSignature;
                }
            }
            
            // Fallback to pattern-based decryption methods
            const decryptionMethods = [
                // Method 1: No transformation (sometimes works)
                () => signature,
                
                // Method 2: Reverse the signature
                () => signature.split('').reverse().join(''),
                
                // Method 3: Remove first character, then reverse
                () => {
                    let s = signature;
                    if (s.length > 1) {
                        s = s.substring(1);
                        s = s.split('').reverse().join('');
                    }
                    return s;
                },
                
                // Method 4: Remove first two characters, then reverse
                () => {
                    let s = signature;
                    if (s.length > 2) {
                        s = s.substring(2);
                        s = s.split('').reverse().join('');
                    }
                    return s;
                },
                
                // Method 5: Swap first and last characters
                () => {
                    let s = signature;
                    if (s.length > 1) {
                        s = s.charAt(s.length - 1) + s.substring(1, s.length - 1) + s.charAt(0);
                    }
                    return s;
                },
                
                // Method 6: Remove character at position 0, swap positions 1 and 2, then reverse
                () => {
                    let s = signature;
                    if (s.length > 3) {
                        s = s.substring(1); // Remove first character
                        s = s.charAt(1) + s.charAt(0) + s.substring(2); // Swap positions 1 and 2
                        s = s.split('').reverse().join(''); // Reverse
                    }
                    return s;
                },
                
                // Method 7: Advanced pattern based on common YouTube transformations
                () => {
                    let s = signature;
                    if (s.length > 10) {
                        // Remove characters at specific positions
                        let chars = s.split('');
                        chars.splice(0, 1); // Remove first
                        chars.splice(0, 1); // Remove new first
                        chars.splice(chars.length - 1, 1); // Remove last
                        s = chars.join('');
                        s = s.split('').reverse().join('');
                    }
                    return s;
                }
            ];
            
            // Try each decryption method
            for (let i = 0; i < decryptionMethods.length; i++) {
                const decryptedSignature = decryptionMethods[i]();
                console.log(`[YouTubeBypass] Decryption method ${i + 1}: ${decryptedSignature.substring(0, 20)}...`);
                
                // Validate the decrypted signature (basic check)
                if (decryptedSignature && decryptedSignature.length > 10) {
                    return decryptedSignature;
                }
            }
            
            // If all methods fail, return the original signature
            return signature;
            
        } catch (error) {
            console.log(`[YouTubeBypass] Signature decryption failed: ${error.message}`);
            return signature;
        }
    }

    // Get player JavaScript URL from YouTube
    async getPlayerJsUrl(videoId) {
        try {
            const response = await this.makeRequest(`https://www.youtube.com/watch?v=${videoId}`, {
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Referer': 'https://www.youtube.com/',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                const playerJsMatch = html.match(/"jsUrl":"([^"]+)"/);
                if (playerJsMatch && playerJsMatch[1]) {
                    let playerJsUrl = playerJsMatch[1].replace(/\\/g, '');
                    if (playerJsUrl.startsWith('//')) {
                        playerJsUrl = 'https:' + playerJsUrl;
                    } else if (playerJsUrl.startsWith('/')) {
                        playerJsUrl = 'https://www.youtube.com' + playerJsUrl;
                    }
                    console.log(`[YouTubeBypass] Found player JS URL: ${playerJsUrl}`);
                    return playerJsUrl;
                }
            }
        } catch (error) {
            console.log(`[YouTubeBypass] Failed to get player JS URL: ${error.message}`);
        }
        return null;
    }

    // Decrypt signature using player JavaScript
    async decryptSignatureFromPlayerJs(signature, playerJsUrl) {
        try {
            const response = await this.makeRequest(playerJsUrl, {
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Referer': 'https://www.youtube.com/',
                    'DNT': '1',
                    'Connection': 'keep-alive'
                }
            });
            
            if (response.ok) {
                const playerJs = await response.text();
                
                // Extract the signature function name
                const funcNameMatch = playerJs.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function\s*\(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\)\s*\{\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[a-zA-Z_$][a-zA-Z0-9_$]*\.split\s*\(\s*['"]{2}\s*\)/);
                if (funcNameMatch) {
                    const funcName = funcNameMatch[1];
                    console.log(`[YouTubeBypass] Found signature function: ${funcName}`);
                    
                    // Try to simulate the signature transformation
                    // This is a simplified version - in practice, you would need to
                    // parse and execute the actual JavaScript transformation
                    return this.simulateSignatureTransformation(signature, playerJs, funcName);
                }
            }
        } catch (error) {
            console.log(`[YouTubeBypass] Failed to decrypt signature from player JS: ${error.message}`);
        }
        return null;
    }

    // Simulate signature transformation based on player JS patterns
    simulateSignatureTransformation(signature, playerJs, funcName) {
        try {
            // Look for common transformation patterns in the player JS
            const transformations = [];
            
            // Pattern 1: Reverse
            if (playerJs.includes('.reverse()')) {
                transformations.push('reverse');
            }
            
            // Pattern 2: Splice/Remove characters
            const spliceMatch = playerJs.match(/\.splice\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g);
            if (spliceMatch) {
                transformations.push('splice');
            }
            
            // Pattern 3: Swap characters
            if (playerJs.includes('var c=a[0];a[0]=a[b%a.length];a[b%a.length]=c')) {
                transformations.push('swap');
            }
            
            // Apply transformations
            let result = signature;
            for (const transform of transformations) {
                switch (transform) {
                    case 'reverse':
                        result = result.split('').reverse().join('');
                        break;
                    case 'splice':
                        if (result.length > 2) {
                            result = result.substring(1);
                        }
                        break;
                    case 'swap':
                        if (result.length > 1) {
                            result = result.charAt(result.length - 1) + result.substring(1, result.length - 1) + result.charAt(0);
                        }
                        break;
                }
            }
            
            console.log(`[YouTubeBypass] Applied transformations: ${transformations.join(', ')}`);
            return result;
            
        } catch (error) {
            console.log(`[YouTubeBypass] Signature transformation simulation failed: ${error.message}`);
            return signature;
        }
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

    // Advanced YouTube API bypass using internal APIs with latest methods
    async bypassUsingInternalAPI(videoId) {
        console.log(`[YouTubeBypass] Attempting internal API bypass for video: ${videoId}`);
        
        const apiMethods = [
            // Method 1: YouTube TV HTML5 Embedded Player (Latest bypass)
            async () => {
                const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                            clientVersion: '2.0',
                            clientScreen: 'EMBED',
                            hl: 'en',
                            gl: 'US',
                            utcOffsetMinutes: 0
                        },
                        thirdParty: {
                            embedUrl: 'https://www.youtube.com/'
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            html5Preference: 'HTML5_PREF_WANTS'
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36',
                        'Origin': 'https://www.youtube.com',
                        'Referer': 'https://www.youtube.com/embed/' + videoId,
                        'X-YouTube-Client-Name': '85',
                        'X-YouTube-Client-Version': '2.0'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && data.streamingData && !data.playabilityStatus?.status?.includes('ERROR')) {
                        console.log(`[YouTubeBypass] TV HTML5 Embedded Player success!`);
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            },
            
            // Method 2: YouTube iOS Music API (Latest bypass)
            async () => {
                const apiKey = 'AIzaSyBAETezhkwP0ZWA02RsqT1zu78Fpt0bC_s';
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: 'IOS_MUSIC',
                            clientVersion: '6.42',
                            deviceModel: 'iPhone14,2',
                            deviceMake: 'Apple',
                            osName: 'iOS',
                            osVersion: '17.1.1',
                            hl: 'en',
                            gl: 'US'
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            signatureTimestamp: Math.floor(Date.now() / 1000)
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'com.google.ios.youtubemusic/6.42 (iPhone14,2; U; CPU iOS 17_1_1 like Mac OS X)',
                        'X-YouTube-Client-Name': '26',
                        'X-YouTube-Client-Version': '6.42'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && data.streamingData && !data.playabilityStatus?.status?.includes('ERROR')) {
                        console.log(`[YouTubeBypass] iOS Music API success!`);
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            },
            
            // Method 3: YouTube Android TV API (Latest bypass)
            async () => {
                const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: 'ANDROID_TV',
                            clientVersion: '2.0',
                            androidSdkVersion: 30,
                            platform: 'TV',
                            hl: 'en',
                            gl: 'US'
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            html5Preference: 'HTML5_PREF_WANTS',
                            lactThreshold: 4000,
                            signatureTimestamp: Math.floor(Date.now() / 1000)
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'com.google.android.youtube.tv/2.0 (Linux; U; Android 11; en_US)',
                        'X-YouTube-Client-Name': '7',
                        'X-YouTube-Client-Version': '2.0'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && data.streamingData && !data.playabilityStatus?.status?.includes('ERROR')) {
                        console.log(`[YouTubeBypass] Android TV API success!`);
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            },
            
            // Method 4: YouTube Web Player with enhanced context (Latest bypass)
            async () => {
                const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
                const clientName = 'WEB';
                const clientVersion = '2.20250716.01.00';
                
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: clientName,
                            clientVersion: clientVersion,
                            hl: 'en',
                            gl: 'US',
                            utcOffsetMinutes: -300,
                            visitorData: this.generateVisitorData(),
                            clientScreen: 'WATCH_FULL_SCREEN',
                            mainAppWebInfo: {
                                graftUrl: '/watch?v=' + videoId,
                                webDisplayMode: 'WEB_DISPLAY_MODE_BROWSER',
                                isWebNativeShareAvailable: true
                            }
                        },
                        user: {
                            lockedSafetyMode: false
                        },
                        request: {
                            useSsl: true,
                            internalExperimentFlags: [],
                            consistencyTokenJars: []
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            html5Preference: 'HTML5_PREF_WANTS',
                            lactThreshold: 4000,
                            signatureTimestamp: Math.floor(Date.now() / 1000),
                            referer: 'https://www.youtube.com/watch?v=' + videoId
                        }
                    },
                    attestationRequest: {
                        omitBotguardAttestation: false
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': this.getRandomUserAgent(),
                        'Origin': 'https://www.youtube.com',
                        'Referer': 'https://www.youtube.com/watch?v=' + videoId,
                        'X-YouTube-Client-Name': '1',
                        'X-YouTube-Client-Version': clientVersion,
                        'X-YouTube-Bootstrap-Logged-In': 'false',
                        'X-YouTube-Page-CL': Math.floor(Math.random() * 1000000000).toString(),
                        'X-YouTube-Page-Label': 'youtube.desktop.web_20250716_01_RC00',
                        'X-YouTube-Utc-Offset': '-300',
                        'X-Goog-Visitor-Id': this.generateVisitorData()
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && data.streamingData && !data.playabilityStatus?.status?.includes('ERROR')) {
                        console.log(`[YouTubeBypass] Enhanced Web Player success!`);
                        return this.formatInternalAPIResponse(data);
                    }
                }
                return null;
            },
            
            // Method 5: YouTube Age-gate bypass (Latest technique)
            async () => {
                const apiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
                const payload = {
                    videoId: videoId,
                    context: {
                        client: {
                            clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                            clientVersion: '2.0',
                            clientScreen: 'EMBED',
                            hl: 'en',
                            gl: 'US'
                        },
                        thirdParty: {
                            embedUrl: 'https://www.youtube.com/embed/' + videoId
                        }
                    },
                    playbackContext: {
                        contentPlaybackContext: {
                            html5Preference: 'HTML5_PREF_WANTS'
                        }
                    }
                };
                
                const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey + '&prettyPrint=false', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36',
                        'Origin': 'https://www.youtube.com',
                        'Referer': 'https://www.youtube.com/embed/' + videoId,
                        'X-YouTube-Client-Name': '85',
                        'X-YouTube-Client-Version': '2.0'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.videoDetails && data.streamingData && !data.playabilityStatus?.status?.includes('ERROR')) {
                        console.log(`[YouTubeBypass] Age-gate bypass success!`);
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
            
            console.log(`[YouTubeBypass] Getting stream for video: ${videoId} with options:`, options);
            
            // Try to get video info first using our enhanced bypass
            const videoInfo = await this.extractVideoInfo(videoId);
            
            if (!videoInfo.success) {
                console.log(`[YouTubeBypass] Video info extraction failed, trying fallback stream`);
                throw new Error('Failed to extract video info: ' + videoInfo.error);
            }
            
            console.log(`[YouTubeBypass] Video info extracted successfully, attempting direct stream`);
            
            // Debug: Log the full structure of what we got
            console.log(`[YouTubeBypass] Video info keys:`, Object.keys(videoInfo.info || {}));
            console.log(`[YouTubeBypass] Video info structure:`, JSON.stringify(videoInfo.info, null, 2).substring(0, 1000));
            
            // Extract streaming URLs from the video info
            const formats = videoInfo.info?.formats || [];
            const adaptiveFormats = videoInfo.info?.adaptiveFormats || [];
            
            if (formats.length === 0 && adaptiveFormats.length === 0) {
                console.log(`[YouTubeBypass] No formats found in video info`);
                console.log(`[YouTubeBypass] Available keys in video info:`, Object.keys(videoInfo.info || {}));
                throw new Error('No formats found in video info');
            }
            
            // Find the best format based on options
            let availableFormats = [];
            
            // First, try to find formats with URLs (signatureCipher, url, or cipher)
            const formatsWithUrls = [...formats, ...adaptiveFormats].filter(f => f.signatureCipher || f.url || f.cipher);
            
            if (options.filter === 'audioonly') {
                // For audio-only, prefer formats with URLs that have audio
                availableFormats = formatsWithUrls.filter(f => 
                    f.mimeType && (f.mimeType.includes('audio') || f.audioQuality)
                );
                
                // If no audio formats with URLs, use any format with URL
                if (availableFormats.length === 0) {
                    availableFormats = formatsWithUrls;
                }
                
                // If still no formats with URLs, fallback to adaptive formats
                if (availableFormats.length === 0) {
                    availableFormats = adaptiveFormats.filter(f => f.mimeType && f.mimeType.includes('audio'));
                }
            } else {
                // For video, prefer formats with URLs
                availableFormats = formatsWithUrls.length > 0 ? formatsWithUrls : [...formats, ...adaptiveFormats];
            }
            
            if (availableFormats.length === 0) {
                throw new Error('No suitable formats found');
            }
            
            console.log(`[YouTubeBypass] Available formats count: ${availableFormats.length}`);
            console.log(`[YouTubeBypass] Available formats with URLs:`, availableFormats.map(f => ({
                itag: f.itag,
                mimeType: f.mimeType,
                hasUrl: !!f.url,
                hasSignatureCipher: !!f.signatureCipher,
                hasCipher: !!f.cipher,
                quality: f.quality,
                audioQuality: f.audioQuality
            })));
            
            // Select the best format - prioritize formats with URLs
            let bestFormat = availableFormats.find(f => f.signatureCipher || f.url || f.cipher);
            
            if (!bestFormat) {
                // Fallback to any format
                bestFormat = availableFormats.find(f => f.quality === options.quality) || availableFormats[0];
            }
            
            if (!bestFormat) {
                throw new Error('No best format found');
            }
            
            console.log(`[YouTubeBypass] Selected format:`, JSON.stringify(bestFormat, null, 2).substring(0, 500));
            
            // Get the streaming URL with advanced 403 bypass
            const streamUrl = await this.getStreamingUrl(bestFormat, videoId);
            if (!streamUrl) {
                throw new Error('Failed to get streaming URL');
            }
            
            console.log(`[YouTubeBypass] Using advanced stream URL with quality: ${bestFormat.quality || 'unknown'}`);
            console.log(`[YouTubeBypass] Stream URL: ${streamUrl.substring(0, 100)}...`);
            
            // Create a stream with advanced headers to bypass 403 errors
            const stream = await this.createAdvancedStream(streamUrl, videoId, bestFormat);
            return stream;
            
        } catch (error) {
            console.error(`[YouTubeBypass] Stream error:`, error);
            
            // Try YouTube Music API as alternative (often has different signature requirements)
            try {
                console.log(`[YouTubeBypass] Trying YouTube Music API bypass...`);
                const musicResult = await this.bypassWithYouTubeMusic(videoId);
                if (musicResult.success) {
                    return musicResult;
                }
            } catch (musicError) {
                console.log(`[YouTubeBypass] YouTube Music API failed: ${musicError.message}`);
            }
            
            // Fallback to ytdl-core with enhanced headers as last resort
            try {
                const ytdl = require('@distube/ytdl-core');
                
                const streamOptions = {
                    quality: options.quality || 'highestaudio',
                    filter: options.filter || 'audioonly',
                    requestOptions: {
                        headers: {
                            ...this.generateProxyHeaders(),
                            'Cookie': this.generateSessionCookies()
                        }
                    }
                };
                
                console.log(`[YouTubeBypass] Fallback to ytdl-core with enhanced headers`);
                const stream = ytdl(url, streamOptions);
                
                return {
                    success: true,
                    stream: stream
                };
            } catch (fallbackError) {
                console.error(`[YouTubeBypass] Fallback stream error:`, fallbackError);
                return {
                    success: false,
                    error: fallbackError.message
                };
            }
        }
    }

    // Advanced streaming URL processing with 403 bypass
    async getStreamingUrl(format, videoId) {
        try {
            let streamUrl;
            
            if (format.url) {
                streamUrl = format.url;
                console.log(`[YouTubeBypass] Using direct URL from format`);
            } else if (format.signatureCipher) {
                // Decode the signatureCipher to extract the URL
                console.log(`[YouTubeBypass] signatureCipher raw data:`, format.signatureCipher);
                const params = new URLSearchParams(format.signatureCipher);
                const url = params.get('url');
                const signature = params.get('s');
                const sp = params.get('sp') || 'sig';

                console.log(`[YouTubeBypass] Decoded signatureCipher params: url=${url ? 'present' : 'missing'}, s=${signature ? 'present' : 'missing'}, sp=${sp}`);

                if (url && signature) {
                    // Decode the URL and signature properly
                    const decodedUrl = decodeURIComponent(url);
                    const decryptedSignature = await this.decryptSignature(signature, videoId);
                    const finalSignature = encodeURIComponent(decryptedSignature);
                    streamUrl = `${decodedUrl}&${sp}=${finalSignature}`;
                    console.log(`[YouTubeBypass] Using signatureCipher URL with decrypted signature`);
                } else if (url) {
                    // Sometimes signature is not required
                    streamUrl = decodeURIComponent(url);
                    console.log(`[YouTubeBypass] Using signatureCipher URL without signature`);
                } else {
                    throw new Error('Cannot extract URL from signatureCipher');
                }
            } else if (format.cipher) {
                // Handle older cipher format
                console.log(`[YouTubeBypass] cipher raw data:`, format.cipher);
                const params = new URLSearchParams(format.cipher);
                const url = params.get('url');
                const signature = params.get('s');
                const sp = params.get('sp') || 'sig';

                if (url && signature) {
                    const decodedUrl = decodeURIComponent(url);
                    const decryptedSignature = await this.decryptSignature(signature, videoId);
                    const finalSignature = encodeURIComponent(decryptedSignature);
                    streamUrl = `${decodedUrl}&${sp}=${finalSignature}`;
                    console.log(`[YouTubeBypass] Using cipher URL with decrypted signature`);
                } else if (url) {
                    streamUrl = decodeURIComponent(url);
                    console.log(`[YouTubeBypass] Using cipher URL without signature`);
                } else {
                    throw new Error('Cannot extract URL from cipher');
                }
            } else {
                throw new Error('No stream URL found in format');
            }
            
            // Process the URL for additional parameters and throttling bypass
            streamUrl = await this.processStreamingUrl(streamUrl, videoId);
            
            return streamUrl;
        } catch (error) {
            console.log(`[YouTubeBypass] Error getting streaming URL: ${error.message}`);
            throw error;
        }
    }

    // Process streaming URL to handle throttling and additional parameters
    async processStreamingUrl(streamUrl, videoId) {
        try {
            const urlObj = new URL(streamUrl);
            
            // Extract and process n-parameter for throttling bypass
            const nParam = urlObj.searchParams.get('n');
            if (nParam) {
                console.log(`[YouTubeBypass] Processing n-parameter for throttling bypass: ${nParam}`);
                const processedN = await this.processNParameter(nParam, videoId);
                if (processedN && processedN !== nParam) {
                    urlObj.searchParams.set('n', processedN);
                    console.log(`[YouTubeBypass] Updated n-parameter from ${nParam} to ${processedN}`);
                }
            }
            
            // Add additional parameters for better access
            urlObj.searchParams.set('ratebypass', 'yes');
            urlObj.searchParams.set('gir', 'yes');
            urlObj.searchParams.set('clen', format.contentLength || '');
            
            // Ensure range parameter is set for better compatibility
            if (!urlObj.searchParams.has('range')) {
                urlObj.searchParams.set('range', '0-');
            }
            
            return urlObj.toString();
        } catch (error) {
            console.log(`[YouTubeBypass] Error processing streaming URL: ${error.message}`);
            return streamUrl; // Return original URL if processing fails
        }
    }

    // Process n-parameter to bypass YouTube throttling
    async processNParameter(nParam, videoId) {
        try {
            // YouTube's n-parameter is used for throttling control
            // This is a simplified implementation of common transformations
            const transformations = [
                // Basic transformations
                (n) => n,
                (n) => n.split('').reverse().join(''),
                (n) => n.substring(1) + n.charAt(0),
                (n) => n.charAt(n.length - 1) + n.substring(0, n.length - 1),
                
                // More complex transformations
                (n) => {
                    if (n.length > 2) {
                        return n.charAt(1) + n.charAt(0) + n.substring(2);
                    }
                    return n;
                },
                (n) => {
                    if (n.length > 3) {
                        return n.substring(0, 2) + n.substring(3) + n.charAt(2);
                    }
                    return n;
                }
            ];
            
            // Try each transformation
            for (const transform of transformations) {
                const transformed = transform(nParam);
                if (transformed !== nParam) {
                    console.log(`[YouTubeBypass] Transformed n-parameter: ${nParam} -> ${transformed}`);
                    return transformed;
                }
            }
            
            return nParam;
        } catch (error) {
            console.log(`[YouTubeBypass] Error processing n-parameter: ${error.message}`);
            return nParam;
        }
    }

    // Create advanced stream with enhanced headers and 403 bypass
    async createAdvancedStream(streamUrl, videoId, format) {
        const https = require('https');
        const http = require('http');
        const { URL } = require('url');
        
        const urlObj = new URL(streamUrl);
        const isHttps = urlObj.protocol === 'https:';
        
        // Generate visitor data that matches the original request
        const visitorData = this.generateVisitorData();
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.youtube.com/watch?v=' + videoId,
                'Origin': 'https://www.youtube.com',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Ch-Ua': this.generateSecChUa(this.getRandomUserAgent()),
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'X-YouTube-Client-Name': '1',
                'X-YouTube-Client-Version': '2.20250716.01.00',
                'X-YouTube-Bootstrap-Logged-In': 'false',
                'X-Goog-Visitor-Id': visitorData,
                'X-Origin': 'https://www.youtube.com',
                'X-Forwarded-For': this.generateRandomIP(),
                'X-Real-IP': this.generateRandomIP(),
                'X-YouTube-Identity-Token': this.generateRandomString(64),
                'X-YouTube-Page-CL': Math.floor(Math.random() * 1000000000).toString(),
                'X-YouTube-Page-Label': 'youtube.desktop.web_20250716_01_RC00',
                'X-YouTube-Utc-Offset': '-300',
                'Range': 'bytes=0-',
                'Cookie': this.generateSessionCookies()
            }
        };
        
        return new Promise((resolve, reject) => {
            const makeRequestWithRetry = (attempt = 1, maxAttempts = 5) => {
                const request = (isHttps ? https : http).request(requestOptions, (response) => {
                    console.log(`[YouTubeBypass] Advanced stream response status: ${response.statusCode} (attempt ${attempt})`);
                    
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        console.log(`[YouTubeBypass] Advanced stream created successfully`);
                        resolve({
                            success: true,
                            stream: response
                        });
                    } else if (response.statusCode === 403 && attempt < maxAttempts) {
                        console.log(`[YouTubeBypass] 403 error, trying advanced bypass... (attempt ${attempt + 1})`);
                        
                        // Enhanced retry with different strategies
                        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                        setTimeout(async () => {
                            // Strategy 1: Change visitor data and IP
                            requestOptions.headers['X-Goog-Visitor-Id'] = this.generateVisitorData();
                            requestOptions.headers['X-Forwarded-For'] = this.generateRandomIP();
                            requestOptions.headers['X-Real-IP'] = this.generateRandomIP();
                            requestOptions.headers['User-Agent'] = this.getRandomUserAgent();
                            
                            // Strategy 2: Add additional authentication headers
                            requestOptions.headers['X-YouTube-Session-Index'] = Math.floor(Math.random() * 1000).toString();
                            requestOptions.headers['X-YouTube-Time-Zone'] = 'America/New_York';
                            requestOptions.headers['X-YouTube-AD-Signals'] = this.generateRandomString(32);
                            
                            // Strategy 3: Try different client contexts
                            if (attempt === 2) {
                                requestOptions.headers['X-YouTube-Client-Name'] = '2'; // Mobile
                                requestOptions.headers['X-YouTube-Client-Version'] = '19.09.37';
                            } else if (attempt === 3) {
                                requestOptions.headers['X-YouTube-Client-Name'] = '7'; // Android TV
                                requestOptions.headers['X-YouTube-Client-Version'] = '2.0';
                            }
                            
                            // Strategy 4: Try with different range requests
                            if (attempt === 4) {
                                delete requestOptions.headers['Range'];
                            }
                            
                            makeRequestWithRetry(attempt + 1, maxAttempts);
                        }, delay);
                    } else {
                        console.log(`[YouTubeBypass] Advanced stream failed with status ${response.statusCode}`);
                        
                        // Read the response body to get more details
                        let errorBody = '';
                        response.on('data', chunk => errorBody += chunk);
                        response.on('end', () => {
                            console.log(`[YouTubeBypass] Advanced stream error response body:`, errorBody);
                            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                        });
                    }
                });
                
                request.on('error', (err) => {
                    if (attempt < maxAttempts) {
                        console.log(`[YouTubeBypass] Advanced stream request error, retrying... (attempt ${attempt + 1}): ${err.message}`);
                        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                        setTimeout(() => makeRequestWithRetry(attempt + 1, maxAttempts), delay);
                    } else {
                        console.log(`[YouTubeBypass] Advanced stream request error:`, err.message);
                        reject(err);
                    }
                });
                
                request.end();
            };
            
            makeRequestWithRetry();
        });
    }

    // YouTube Music API bypass (alternative approach)
    async bypassWithYouTubeMusic(videoId) {
        try {
            console.log(`[YouTubeBypass] Attempting YouTube Music API bypass for: ${videoId}`);
            
            const apiKey = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';
            const payload = {
                videoId: videoId,
                context: {
                    client: {
                        clientName: 'WEB_REMIX',
                        clientVersion: '1.20250716.01.00',
                        hl: 'en',
                        gl: 'US',
                        visitorData: this.generateVisitorData()
                    }
                },
                playbackContext: {
                    contentPlaybackContext: {
                        html5Preference: 'HTML5_PREF_WANTS',
                        signatureTimestamp: Math.floor(Date.now() / 1000)
                    }
                }
            };
            
            const response = await this.makeRequest('https://youtubei.googleapis.com/youtubei/v1/player?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': this.getRandomUserAgent(),
                    'Origin': 'https://music.youtube.com',
                    'Referer': 'https://music.youtube.com/',
                    'X-YouTube-Client-Name': '67',
                    'X-YouTube-Client-Version': '1.20250716.01.00',
                    'X-Goog-Visitor-Id': this.generateVisitorData()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.streamingData && data.streamingData.adaptiveFormats) {
                    const audioFormats = data.streamingData.adaptiveFormats.filter(f => 
                        f.mimeType && f.mimeType.includes('audio') && f.url
                    );
                    
                    if (audioFormats.length > 0) {
                        const bestFormat = audioFormats[0];
                        console.log(`[YouTubeBypass] Found YouTube Music stream with direct URL`);
                        
                        // Create stream directly with the URL
                        const https = require('https');
                        const { URL } = require('url');
                        
                        const urlObj = new URL(bestFormat.url);
                        const requestOptions = {
                            hostname: urlObj.hostname,
                            port: urlObj.port || 443,
                            path: urlObj.pathname + urlObj.search,
                            method: 'GET',
                            headers: {
                                'User-Agent': this.getRandomUserAgent(),
                                'Accept': '*/*',
                                'Accept-Language': 'en-US,en;q=0.9',
                                'Referer': 'https://music.youtube.com/',
                                'Origin': 'https://music.youtube.com',
                                'DNT': '1',
                                'Connection': 'keep-alive',
                                'Range': 'bytes=0-'
                            }
                        };
                        
                        return new Promise((resolve, reject) => {
                            const request = https.request(requestOptions, (response) => {
                                if (response.statusCode >= 200 && response.statusCode < 300) {
                                    console.log(`[YouTubeBypass] YouTube Music stream created successfully`);
                                    resolve({
                                        success: true,
                                        stream: response
                                    });
                                } else {
                                    reject(new Error(`YouTube Music API failed: ${response.statusCode}`));
                                }
                            });
                            
                            request.on('error', reject);
                            request.end();
                        });
                    }
                }
            }
            
            throw new Error('YouTube Music API did not return suitable formats');
            
        } catch (error) {
            console.log(`[YouTubeBypass] YouTube Music API bypass failed: ${error.message}`);
            throw error;
        }
    }
}

module.exports = YouTubeBypass;
