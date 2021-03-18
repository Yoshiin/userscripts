// ==UserScript==
// @name         Twitch VOD - Show full date & time
// @namespace    https://github.com/Yoshiin/userscripts/twitch/
// @version      1.0
// @description  Add VOD full date time on video page
// @author       Yoshin
// @match        https://www.twitch.tv/videos/*
// @grant        none
// @copyright    2021, Yoshin
// @homepageURL  https://github.com/Yoshiin/userscripts/
// ==/UserScript==

/* jshint esversion: 6 */

(async function() {
    'use strict';

    const vodId = window.location.href.match(/https\:\/\/www\.twitch\.tv\/videos\/([A-z0-9]+)/m)[1];
    if (!vodId) {
        return;
    }

    const res = await fetch(`https://api.twitch.tv/kraken/videos/${vodId}`, {
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        },
    });

    const data = await res.json();
    if (!data.created_at) {
        return;
    }

    const startDate = new Date(data.created_at);
    const startDateStr = startDate.toLocaleString();
    const endDate = startDate;
    endDate.setSeconds(endDate.getSeconds() + data.length);
    const endDateStr = endDate.toLocaleString();

    new MutationObserver(function(mutations) {
        let vodTitle = document.querySelector('h2[data-a-target="stream-title"]');
        if (vodTitle) {
            vodTitle.insertAdjacentHTML('afterend', `<span>${startDateStr} -> ${endDateStr}</span>`);
            this.disconnect();
        }
    }).observe(document, {childList: true, subtree: true});
})();