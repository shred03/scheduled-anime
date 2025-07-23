import fs from 'fs/promises';
import path from 'path';

const CUSTOM_LISTS_FILE = 'custom_lists.json';

export class CustomAnimeList {
    static async loadCustomLists() {
        try {
            const data = await fs.readFile(CUSTOM_LISTS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    static async saveCustomLists(lists) {
        await fs.writeFile(CUSTOM_LISTS_FILE, JSON.stringify(lists, null, 2));
    }

    static async getUserCustomList(userId) {
        const lists = await this.loadCustomLists();
        return lists[userId] || [];
    }

    static async addAnimeToUserList(userId, animeTitle) {
        const lists = await this.loadCustomLists();
        
        if (!lists[userId]) {
            lists[userId] = [];
        }

        const normalizedTitle = animeTitle.toLowerCase().trim();
        const exists = lists[userId].some(anime => 
            anime.toLowerCase().trim() === normalizedTitle
        );

        if (!exists) {
            lists[userId].push(animeTitle);
            await this.saveCustomLists(lists);
            return true;
        }
        
        return false;
    }

    static async removeAnimeFromUserList(userId, animeTitle) {
        const lists = await this.loadCustomLists();
        
        if (!lists[userId]) {
            return false;
        }

        const normalizedTitle = animeTitle.toLowerCase().trim();
        const initialLength = lists[userId].length;
        
        lists[userId] = lists[userId].filter(anime => 
            anime.toLowerCase().trim() !== normalizedTitle
        );

        if (lists[userId].length < initialLength) {
            await this.saveCustomLists(lists);
            return true;
        }

        return false;
    }

    static async clearUserList(userId) {
        const lists = await this.loadCustomLists();
        
        if (lists[userId]) {
            lists[userId] = [];
            await this.saveCustomLists(lists);
            return true;
        }
        
        return false;
    }

    static async filterAnimeByCustomList(userId, animeList) {
        const customList = await this.getUserCustomList(userId);
        
        if (customList.length === 0) {
            return [];
        }

        const customTitles = customList.map(title => title.toLowerCase().trim());
        
        return animeList.filter(anime => 
            customTitles.includes(anime.title.toLowerCase().trim())
        );
    }
}