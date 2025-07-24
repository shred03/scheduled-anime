import fetch from 'node-fetch';
import Config from '../config.js';

const API_BASE = 'https://animeschedule.net/api/v3';
const TOKEN = Config.ANIMESCHEDULE_TOKEN;

export class AnimeSchedule {
    static capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static async fetchAllScheduledAnime() {
        const res = await fetch(`${API_BASE}/timetables`, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status}`);
        }

        return await res.json();
    }

    static async getAnimeByDay(targetDay) {
        const json = await this.fetchAllScheduledAnime();
        const animeMap = new Map();

        json.forEach(anime => {
            const name = anime.english || anime.title || 'No Title';
            const episode = anime.episodeNumber || 'N/A';
            const status = anime.status || 'Unknown';
            const airType = anime.airType || 'Sub';
            const episodeDate = anime.episodeDate;

            if (!episodeDate) return; // Skip if no date

            const date = new Date(episodeDate);
            
            // Convert to IST (UTC+5:30)
            const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
            const istDate = new Date(date.getTime() + istOffset);

            // Get day of week properly
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayOfWeek = dayNames[istDate.getUTCDay()];

            if (dayOfWeek === targetDay.toLowerCase()) {
                // Format time in 12-hour format
                const formattedTime = istDate.toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'UTC' // Since we already converted to IST
                });

                const key = name.toLowerCase().trim();
                
                if (!animeMap.has(key)) {
                    animeMap.set(key, {
                        title: name,
                        episode: episode,
                        status: status,
                        types: []
                    });
                }

                const animeData = animeMap.get(key);
                animeData.types.push({
                    type: this.capitalizeFirstLetter(airType.toLowerCase()),
                    time: formattedTime,
                });
            }
        });

        const sortedAnime = Array.from(animeMap.values());
        sortedAnime.sort((a, b) => a.title.localeCompare(b.title));

        return sortedAnime;
    }

    static formatAnimeList(animeList, dayName = 'today') {
        if (animeList.length === 0) {
            return `🔍 No anime scheduled for ${dayName}.`;
        }

        let message = '\n';
        animeList.forEach((anime, index) => {
            message += `✦ <b>${anime.title}</b>\n`;
            message += `✦ <b>Episode:</b> <code>${anime.episode}</code> | <b>Status:</b> <code>${anime.status}</code>\n`;
            
            if (anime.types.length === 1) {
                message += `✦ <b>Type:</b> • <code>${anime.types[0].type}</code> | <code>${anime.types[0].time}</code>\n`;
            } else {
                message += '✦ <b>Types:</b>';
                anime.types.forEach((typeInfo) => {
                    message += ` • <code>${typeInfo.type}: ${typeInfo.time}</code> `;   
                });
                message += "\n";
            }
            
            message += '<b>┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈</b>\n';
        });

        message += `\n<i>📊 Total anime: ${animeList.length}</i>\n<blockquote><b>Join Us: @AnimeKe14Hai</b></blockquote>\n<b><blockquote>Powered By: @TeamXpirates</blockquote></b>`;
        return message;
    }
}