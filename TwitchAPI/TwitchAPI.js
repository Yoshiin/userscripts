// ==UserScript==
// @name         TwitchAPI
// @namespace    https://github.com/Yoshiin/userscripts/
// @version      1.1
// @description  A Twitch API lib for Userscripts
// @author       Yoshin <l.mora@outlook.fr> (https://github.com/Yoshiin/)
// ==/UserScript==
/*
* TwitchAPI.js
* v1.1.0
*/
class TwitchAPI {
    #clientId;
    #clientSecret;
    #accessToken;
    #storageKey;
    #needToUpdate = true;

    constructor(clientId, clientSecret, storageKey = "twapi") {
        this.#clientId = clientId;
        this.#clientSecret = clientSecret;
        this.#storageKey = storageKey;
    }

    async getStream(userName) {
        try {
            await this.#refreshAccessToken();
        } catch (error) {
            throw error;
        }
        const lsData = JSON.parse(localStorage.getItem(`${this.#storageKey}:twitchApiData`));
        if (lsData.expirationDate < Date.now()) {
            this.#cLogger('error', 'Outdated access_token, cannot fetch /streams');
            return undefined;
        } else {
            const streamRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/streams?user_login=${userName}`);
            if (streamRequestData.status !== 200) {
                this.#cLogger('error', `Error requesting /streams for "${userName}" (status: ${streamRequestData.status}): ${streamRequestData}`);
                return undefined;
            } else {
                const streamRequestJson = await streamRequestData.json();
                return streamRequestJson.data[0];
            }
        }
    }

    async isLive(userName) {
        return (await this.getStream(userName)) !== undefined;
    }

    async getVod(vodId) {
        try {
            await this.#refreshAccessToken();
        } catch (error) {
            throw error;
        }
        const lsData = JSON.parse(localStorage.getItem(`${this.#storageKey}:twitchApiData`));
        if (lsData.expirationDate < Date.now()) {
            this.#cLogger('error', 'Outdated access_token, cannot fetch /videos');
            return undefined;
        } else {
            const vodRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/videos?id=${vodId}`);
            if (vodRequestData.status !== 200) {
                this.#cLogger('error', `Error requesting /videos for id "${vodId}" (status: ${vodRequestData.status}): ${vodRequestData}`);
                return undefined;
            } else {
                const vodRequestJson = await vodRequestData.json();
                return vodRequestJson.data[0];
            }
        }
    }

    async getLastArchiveVod(userName) {
        const userData = await this.getUser(userName);
        try {
            await this.#refreshAccessToken();
        } catch (error) {
            throw error;
        }
        const lsData = JSON.parse(localStorage.getItem(`${this.#storageKey}:twitchApiData`));
        if (lsData.expirationDate < Date.now()) {
            this.#cLogger('error', 'Outdated access_token, cannot fetch /videos');
            return undefined;
        } else {
            const lastVodRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/videos?user_id=${userData.id}&first=1&sort=time&type=archive`);
            if (lastVodRequestData.status !== 200) {
                this.#cLogger('error', `Error requesting /videos for user_id "${userData.id}" (status: ${lastVodRequestData.status}): ${lastVodRequestData}`);
                return undefined;
            } else {
                const lastVodRequestJson = await lastVodRequestData.json();
                return lastVodRequestJson.data[0];
            }
        }
    }

    async getUser(userName) {
        try {
            await this.#refreshAccessToken();
        } catch (error) {
            throw error;
        }
        const lsData = JSON.parse(localStorage.getItem(`${this.#storageKey}:twitchApiData`));
        if (lsData.expirationDate < Date.now()) {
            this.#cLogger('error', 'Outdated access_token, cannot fetch /users');
            return undefined;
        } else {
            const userRequestData = await this.#fetchWithTimeout(`https://api.twitch.tv/helix/users?login=${userName}`);
            if (userRequestData.status !== 200) {
                this.#cLogger('error', `Error requesting /users for login "${userName}" (status: ${userRequestData.status}): ${userRequestData}`);
                return undefined;
            } else {
                const userRequestJson = await userRequestData.json();
                return userRequestJson.data[0];
            }
        }
    }

    #getRequestOpts(_METHOD) {
        return {
            method: _METHOD,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.#accessToken}`,
                'Client-Id': this.#clientId,
            }
        };
    }

    async #refreshAccessToken() {
        if (!this.#clientId?.trim()) {
            this.#cLogger('error', 'No clientId found for Twitch API. Add a client id on the script settings.');
            throw new Error("Missing clientId");
        } else if (!this.#clientSecret?.trim()) {
            this.#cLogger('error', 'No clientSecret found for Twitch API. Add a client secret on the script settings.');
            throw new Error("Missing clientSecret");
        }
        const now = Date.now();
        const twitchApiData = localStorage.getItem(`${this.#storageKey}:twitchApiData`);
        let needToUpdate = false;
        if (twitchApiData === null) {
            this.#cLogger('info', 'No Twitch Access Token found in storage: need to request');
            needToUpdate = true;
        } else if (twitchApiData !== null) {
            const taData = JSON.parse(twitchApiData);
            if (taData.expirationDate <= now) {
                this.#cLogger('info', 'Old Twitch Access Token found in storage: need to refresh');
                needToUpdate = true;
            } else {
                this.#accessToken = taData.accessToken;
            }
        }
        if (needToUpdate) {
            this.#cLogger('info', 'Requesting Twitch Access Token...');
            const auth = await this.#fetchWithTimeout(
                `https://id.twitch.tv/oauth2/token?client_id=${this.#clientId}&client_secret=${this.#clientSecret}&grant_type=client_credentials`,
                'POST', false
            );

            if (auth.status !== 200) {
                this.#cLogger('error', `Error requesting new Twitch Access Token (status: ${auth.status}): ${auth}`);
            } else {
                const authJson = await auth.json();
                const dataObj = {
                    clientId: this.#clientId,
                    accessToken: authJson.access_token,
                    expirationDate: now + authJson.expires_in
                };
                this.#accessToken = authJson.access_token;
                localStorage.setItem(`${this.#storageKey}:twitchApiData`, JSON.stringify(dataObj));
                this.#cLogger('info', 'Requesting Twitch Access Token: done');
            }
        }
    }

    #cLogger(type, str) {
        let tColor = '#FFFFFF';
        let lType = 'log';
        switch (type) {
            case 'info':
                tColor = '#FFFFFF';
                lType = 'info';
                break;
            case 'error':
                tColor = '#FF8080';
                lType = 'error';
                break;
        }
        window.console[lType](`%cTwitch API [%c${type}%c]: %c${str}`,
            'color:#674EA7', `color:${tColor}`, 'color:#674EA7', 'color:#FFFFFF');
    }

    async #fetchWithTimeout(resource, method = 'GET', needHeaders = true) {
        const headers = !needHeaders ? {} : {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.#accessToken}`,
            'Client-Id': this.#clientId,
        };
        const options = {
            method,
            headers,
        };
        const { timeout = 5000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    }
}
