// ==UserScript==
// @name         TwitchAPI
// @namespace    https://github.com/Yoshiin/userscripts/
// @version      1.2
// @description  A Twitch API lib for Userscripts
// @author       Yoshin <l.mora@outlook.fr> (https://github.com/Yoshiin/)
// ==/UserScript==

/*
* TwitchAPI.js
* v1.2.0
*/

class TwitchAPI {
    #clientId;
    #clientSecret;
    #accessToken;
    #storageKey;
    #needToUpdate = true;

    constructor(clientId = null, clientSecret = null, storageKey = "twapi") {
        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
        this.#storageKey = storageKey;
        this.#needToUpdate = !!(this.#clientId && this.#clientSecret);
    }

    get clientId() {
        return this.#clientId;
    }

    set clientId(value) {
        if (this.#clientId !== value) {
            this.#clientId = value?.trim() || null;
            this.#resetTokenState();
            this.#cLogger('info', 'Client ID updated.');
        }
    }

    get clientSecret() {
        return this.#clientSecret;
    }

    set clientSecret(value) {
        if (this.#clientSecret !== value) {
            this.#clientSecret = value?.trim() || null;
            this.#resetTokenState();
            this.#cLogger('info', 'Client Secret updated.');
        }
    }

    #resetTokenState() {
        this.#accessToken = null;
        localStorage.removeItem(`${this.#storageKey}:twitchApiData`);
        this.#needToUpdate = !!(this.#clientId && this.#clientSecret);
        this.#cLogger('info', 'Credentials changed, access token state reset.');
    }


    async getStream(userName) {
        try {
            await this.#refreshAccessToken();
        } catch (error) {
            this.#cLogger('error', `Failed to get stream for ${userName}: ${error.message}`);
            throw error;
        }
        const streamRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/streams?user_login=${userName}`);
        if (streamRequestData.status !== 200) {
            this.#cLogger('error', `Error requesting /streams for "${userName}" (status: ${streamRequestData.status})`);
            return null;
        } else {
            const streamRequestJson = await streamRequestData.json();
            return streamRequestJson.data[0];
        }
    }

    async isLive(userName) {
        try {
            const stream = await this.getStream(userName);
            return !!stream;
        } catch (error) {
            return false;
        }
    }

    async getVod(vodId) {
        try {
            await this.#refreshAccessToken();
        } catch (error) {
            this.#cLogger('error', `Failed to get VOD ${vodId}: ${error.message}`);
            throw error;
        }

        const vodRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/videos?id=${vodId}`);
        if (vodRequestData.status !== 200) {
            this.#cLogger('error', `Error requesting /videos for id "${vodId}" (status: ${vodRequestData.status})`);
            return null;
        } else {
            const vodRequestJson = await vodRequestData.json();
            return vodRequestJson.data[0];
        }
    }

    async getLastArchiveVod(userName) {
        let userData;
        try {
             userData = await this.getUser(userName);
             if (!userData) {
                 this.#cLogger('error', `Could not find user ${userName} to get last VOD.`);
                 return null;
             }
             await this.#refreshAccessToken();
        } catch (error) {
            this.#cLogger('error', `Failed to get last archive VOD for ${userName}: ${error.message}`);
            throw error;
        }

        const lastVodRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/videos?user_id=${userData.id}&first=1&sort=time&type=archive`);
        if (lastVodRequestData.status !== 200) {
            this.#cLogger('error', `Error requesting last VOD for user_id "${userData.id}" (status: ${lastVodRequestData.status})`);
            return null;
        } else {
            const lastVodRequestJson = await lastVodRequestData.json();
            return lastVodRequestJson.data[0];
        }
    }

    async getUser(userName) {
        try {
            await this.#refreshAccessToken();
        } catch (error) {
            this.#cLogger('error', `Failed to get user ${userName}: ${error.message}`);
            throw error;
        }

        const userRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/users?login=${userName}`);
        if (userRequestData.status !== 200) {
            this.#cLogger('error', `Error requesting /users for login "${userName}" (status: ${userRequestData.status})`);
            return null;
        } else {
            const userRequestJson = await userRequestData.json();
            return userRequestJson.data[0];
        }
    }

    async validateCredentials() {
        if (!this.#clientId || !this.#clientSecret) {
            this.#cLogger('error', 'Missing clientId or clientSecret.');
            return false;
        }
        try {
            const authResponse = await this.#fetchWithTimeout(
                `https://id.twitch.tv/oauth2/token?client_id=${this.#clientId}&client_secret=${this.#clientSecret}&grant_type=client_credentials`,
                'POST',
                false
            );

            if (!authResponse.ok) {
                this.#cLogger('error', `Credential validation failed: ${response.status}`);
                return false;
            }
            const authJson = await authResponse.json();
            if (authJson.access_token) {
                this.#cLogger('info', 'clientId and clientSecret are valid.');
                return true;
            } else {
                this.#cLogger('error', 'No access_token received during validation.');
                return false;
            }
        } catch (error) {
            this.#cLogger('error', `Credential validation error: ${error.message}`);
            return false;
        }
    }

    async #refreshAccessToken() {
        if (!this.#clientId) {
            this.#cLogger('error', 'Twitch API Client ID is not set.');
            throw new Error("Missing clientId. Set it using the clientId setter or constructor.");
        }
        if (!this.#clientSecret) {
            this.#cLogger('error', 'Twitch API Client Secret is not set.');
            throw new Error("Missing clientSecret. Set it using the clientSecret setter or constructor.");
        }

        const now = Date.now();
        const twitchApiDataString = localStorage.getItem(`${this.#storageKey}:twitchApiData`);
        let twitchApiData = null;
        let needsNewToken = true;

        if (twitchApiDataString) {
            try {
                twitchApiData = JSON.parse(twitchApiDataString);
                if (twitchApiData.accessToken &&
                    twitchApiData.clientId === this.#clientId &&
                    twitchApiData.expirationDate > now)
                {
                    this.#accessToken = twitchApiData.accessToken;
                    needsNewToken = false;
                } else if (twitchApiData.expirationDate <= now) {
                    this.#cLogger('info', 'Twitch Access Token expired.');
                } else if (twitchApiData.clientId !== this.#clientId) {
                     this.#cLogger('info', 'Client ID changed, fetching new token.');
                }
            } catch (e) {
                this.#cLogger('error', 'Failed to parse Twitch API data from storage. Fetching new token.');
                localStorage.removeItem(`${this.#storageKey}:twitchApiData`);
            }
        } else {
             this.#cLogger('info', 'No Twitch Access Token found in storage.');
        }

        if (needsNewToken) {
            this.#cLogger('info', 'Requesting new Twitch Access Token...');
            this.#accessToken = null;

            try {
                const authResponse = await this.#fetchWithTimeout(
                    `https://id.twitch.tv/oauth2/token?client_id=${this.#clientId}&client_secret=${this.#clientSecret}&grant_type=client_credentials`,
                    'POST',
                    false
                );

                if (!authResponse.ok) {
                    const errorText = await authResponse.text();
                    this.#cLogger('error', `Error requesting new Twitch Access Token (status: ${authResponse.status}): ${errorText}`);
                    localStorage.removeItem(`${this.#storageKey}:twitchApiData`);
                    throw new Error(`Twitch token request failed with status ${authResponse.status}`);
                }

                const authJson = await authResponse.json();
                if (!authJson.access_token || !authJson.expires_in) {
                     this.#cLogger('error', 'Received invalid token data from Twitch.');
                     throw new Error('Invalid token data received from Twitch.');
                }

                const dataObj = {
                    clientId: this.#clientId,
                    accessToken: authJson.access_token,
                    expirationDate: now + (authJson.expires_in * 1000) - 60000
                };
                this.#accessToken = dataObj.accessToken;
                localStorage.setItem(`${this.#storageKey}:twitchApiData`, JSON.stringify(dataObj));
                this.#cLogger('info', 'Successfully obtained and stored new Twitch Access Token.');

            } catch (error) {
                 this.#cLogger('error', `Network or other error during token fetch: ${error.message}`);
                 throw error;
            }
        }
    }


    #cLogger(type, str) {
        const styles = {
            info: 'color:#674EA7; font-weight: bold;',
            log: 'color:#674EA7;',
            error: 'color:#FF8080; font-weight: bold;',
            text: 'color:#FFFFFF;'
        };
        const typeStyle = styles[type] || styles.log;
        console[type](`%cTwitch API [%c${type}%c]: %c${str}`,
            styles.log, typeStyle, styles.log, styles.text);
    }

    async #fetchWithTimeout(resource, method = 'GET', needAuthHeaders = true, options = {}) {
        const { timeout = 8000 } = options; // Increased default timeout slightly
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const fetchOptions = {
            method,
            headers: {
                 'Accept': 'application/json',
                ...(method === 'POST' || method === 'PUT' ? { 'Content-Type': 'application/json' } : {})
            },
            signal: controller.signal,
            ...options
        };

        if (needAuthHeaders) {
            if (!this.#accessToken) {
                 clearTimeout(id);
                 controller.abort();
                 this.#cLogger('error', `Cannot fetch ${resource}: Access token is missing.`);
                 throw new Error('Twitch access token is missing for authorized request.');
            }
            fetchOptions.headers['Authorization'] = `Bearer ${this.#accessToken}`;
            fetchOptions.headers['Client-Id'] = this.#clientId;
        }

        try {
            const response = await fetch(resource, fetchOptions);
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                this.#cLogger('error', `Fetch timed out for ${resource} after ${timeout}ms`);
                throw new Error(`Request timed out: ${resource}`);
            } else {
                 this.#cLogger('error', `Fetch error for ${resource}: ${error.message}`);
                throw error;
            }
        }
    }
}
