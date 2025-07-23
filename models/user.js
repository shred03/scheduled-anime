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

            const date = new Date(episodeDate);
            const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

            const dayOfWeek = istDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                timeZone: 'Asia/Kolkata'
            }).toLowerCase();

            if (dayOfWeek === targetDay.toLowerCase()) {
                const formattedTime = istDate.toLocaleString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata'
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

    static formatAnimeList(animeList) {
        if (animeList.length === 0) {
            return '🔍 No anime scheduled for this day.\n\n━━━━━━━━━━━━━━━━━━━\n <b>Powered by @TeamXpirates</b> 🏮\n━━━━━━━━━━━━━━━━━━━';
        }

        let message = '\n';
        animeList.forEach((anime, index) => {
            message += `✦ <b>${anime.title}</b>\n`;
            message += `✦ <b>Episode:</b> <code>${anime.episode}</code> | <b>Status:</b> <code>${anime.status}</code>\n`;
            // message += `📊 Status: \`${anime.status}\`\n`;
            if (anime.types.length === 1) {
                message += `✦ <b>Type:</b> • <code>${anime.types[0].type}</code> | <code>${anime.types[0].time}</code>\n`;
                // message += `Time: ${anime.types[0].time}\n`;
            } else {
                message += '✦ <b>Types:</b>';
                anime.types.forEach((typeInfo) => {
                    message += ` • <code>${typeInfo.type}: ${typeInfo.time}</code> `;   
                });
                message+="\n"
            }
            
            message += '<b>┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈</b>\n';
        });

        message += `\n<i>📊 Total anime: ${animeList.length}</i>\n<b><blockquote>Powered by @TeamXpirates</blockquote></b>`;
        return message;
    }
}