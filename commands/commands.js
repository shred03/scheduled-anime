import { AnimeSchedule } from '../models/user.js';
import { CustomAnimeList } from '../helper/custom.js';
import Config from '../config.js';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const START_IMAGE = Config.START_IMAGE || "https://jpcdn.it/img/small/ced62d70d4d0bc5ec60a3b894831e48e.png";
const LIST_IMAGE = Config.LIST_IMAGE || 'https://jpcdn.it/img/small/ced62d70d4d0bc5ec60a3b894831e48e.png';
const MAX_MESSAGE_LENGTH = 4000;
const ADMIN_IDS = Config.ADMIN_IDS;

async function deleteCommandMessage(bot, chatId, messageId) {
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch (error) {
        console.log('Could not delete message:', error.message);
    }
}

function splitMessage(text, maxLength = MAX_MESSAGE_LENGTH) {
    if (text.length <= maxLength) {
        return [text];
    }

    const messages = [];
    let currentMessage = '';
    const lines = text.split('\n');

    for (const line of lines) {
        if ((currentMessage + '\n' + line).length > maxLength) {
            if (currentMessage) {
                messages.push(currentMessage.trim());
                currentMessage = '';
            }

            if (line.length > maxLength) {
                const words = line.split(' ');
                let currentLine = '';

                for (const word of words) {
                    if ((currentLine + ' ' + word).length > maxLength) {
                        if (currentLine) {
                            messages.push(currentLine.trim());
                            currentLine = '';
                        }
                        if (word.length > maxLength) {
                            messages.push(word.substring(0, maxLength - 3) + '...');
                        } else {
                            currentLine = word;
                        }
                    } else {
                        currentLine += (currentLine ? ' ' : '') + word;
                    }
                }

                if (currentLine) {
                    currentMessage = currentLine;
                }
            } else {
                currentMessage = line;
            }
        } else {
            currentMessage += (currentMessage ? '\n' : '') + line;
        }
    }

    if (currentMessage.trim()) {
        messages.push(currentMessage.trim());
    }

    return messages;
}

async function sendLongMessage(bot, chatId, message, options = {}) {
    const messages = splitMessage(message);

    for (let i = 0; i < messages.length; i++) {
        let currentMessage = messages[i];

        if (messages.length > 1) {
            if (i === 0) {
                currentMessage += '\n\n<i>📄 Message continues...</i>';
            } else if (i === messages.length - 1) {
                currentMessage = '<i>📄 ...continued</i>\n\n' + currentMessage;
            } else {
                currentMessage = '<i>📄 ...continued</i>\n\n' + currentMessage + '\n\n<i>📄 Message continues...</i>';
            }
        }

        await bot.sendMessage(chatId, currentMessage, options);

        if (i < messages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

export function setupCommands(bot) {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;

        const welcomeMessage = `
<b><u>Welcome to @TeamXpirates Anime Schedule Bot!</u></b>

📅 <b>Schedule Commands:</b>
• <code>/today</code> - Today's anime schedule
• <code>/tomorrow</code> - Tomorrow's anime schedule
• <code>/sunday</code>, <code>/monday</code> etc. - Specific day schedule

🔖 <b>Custom List Commands:</b>
• <code>/cday</code> - Custom list anime for specific day
• <code>/addanime</code> - Add anime to your list
• <code>/removeanime</code> - Remove from your list
• <code>/mylist</code> - View your custom list
• <code>/clearlist</code> - Clear your custom list

<b>Examples:</b>
<code>cday sunday</code> - Custom anime for Sunday
<code>addanime One Piece</code> - Add One Piece to list

━━━━━━━━━━━━━━━━━━━━━━━━━━━
<blockquote><b>Powered by @TeamXpirates</b></blockquote>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;

        try {
            await bot.sendPhoto(chatId, START_IMAGE, {
                caption: welcomeMessage,
                parse_mode: 'HTML'
            });
            await deleteCommandMessage(bot, chatId, messageId);
        } catch (error) {
            console.error('Error in /start command:', error);
        }
    });

    bot.onText(/\/today/, async (msg) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        const isAdmin = await checkAdmin(bot, msg, chatId);
        if (!isAdmin) return;
        const today = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            timeZone: 'Asia/Kolkata'
        }).toLowerCase();

        await sendAnimeSchedule(bot, chatId, today, 'Today');
        await deleteCommandMessage(bot, chatId, messageId);
    });

    bot.onText(/\/tomorrow/, async (msg) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        const isAdmin = await checkAdmin(bot, msg, chatId);
        if (!isAdmin) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.toLocaleDateString('en-IN', {
            weekday: 'long',
            timeZone: 'Asia/Kolkata'
        }).toLowerCase();

        await sendAnimeSchedule(bot, chatId, tomorrowDay, 'Tomorrow');
        await deleteCommandMessage(bot, chatId, messageId);
    });

    DAYS.forEach(day => {
        bot.onText(new RegExp(`\/${day}`, 'i'), async (msg) => {
            const chatId = msg.chat.id;
            const messageId = msg.message_id;

            await sendAnimeSchedule(bot, chatId, day, day.charAt(0).toUpperCase() + day.slice(1));
            await deleteCommandMessage(bot, chatId, messageId);
        });
    });

    bot.onText(/\/cday (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const isAdmin = await checkAdmin(bot, msg, chatId);
        if (!isAdmin) return;
        const messageId = msg.message_id;
        const userId = msg.from.id.toString();
        const day = match[1].toLowerCase().trim();

        if (!DAYS.includes(day)) {
            await bot.sendMessage(chatId, 'Invalid day! Please use: sunday, monday, tuesday, wednesday, thursday, friday, saturday');
            await deleteCommandMessage(bot, chatId, messageId);
            return;
        }

        try {
            const fetchingMsg = await bot.sendMessage(chatId, '⏳ Fetching your custom anime schedule...');
            const animeList = await AnimeSchedule.getAnimeByDay(day);
            const customAnime = await CustomAnimeList.filterAnimeByCustomList(userId, animeList);

            const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);

            if (customAnime.length === 0) {
                const customList = await CustomAnimeList.getUserCustomList(userId);
                if (customList.length === 0) {
                    await bot.sendMessage(chatId, '🔖 Your custom list is empty!\n\nUse /addanime <title> to add anime to your list.\n\n━━━━━━━━━━━━━━━━━━━\n<b>Powered by @TeamXpirates</b>\n━━━━━━━━━━━━━━━━━━━', { parse_mode: 'HTML' });
                } else {
                    await bot.sendMessage(chatId, `🔍 No anime from your custom list scheduled for ${dayCapitalized}.\n\n━━━━━━━━━━━━━━━━━━━\n<b>Powered by @TeamXpirates</b>\n━━━━━━━━━━━━━━━━━━━`, { parse_mode: 'HTML' });
                }
                await deleteCommandMessage(bot, chatId, fetchingMsg.message_id);
                await deleteCommandMessage(bot, chatId, messageId);
                return;
            }

            const message = `<b><u>${dayCapitalized.toUpperCase()} SCHEDULED ANIME BY: @TEAMXPIRATES</u></b>\n${AnimeSchedule.formatAnimeList(customAnime)}`;

            if (message.length > 1000) {
                await sendLongMessage(bot, chatId, message, { parse_mode: 'HTML' });
            } else {
                await bot.sendPhoto(chatId, LIST_IMAGE, {
                    caption: message,
                    parse_mode: 'HTML'
                });
            }
            await deleteCommandMessage(bot, chatId, fetchingMsg.message_id);
            await deleteCommandMessage(bot, chatId, messageId);
        } catch (error) {
            console.error('Error fetching custom anime:', error);
            await bot.sendMessage(chatId, '❌ Error fetching custom anime schedule. Please try again later.');
            await deleteCommandMessage(bot, chatId, messageId);
        }
    });

    bot.onText(/\/addanime (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const isAdmin = await checkAdmin(bot, msg, chatId);
        if (!isAdmin) return;
        const messageId = msg.message_id;
        const userId = msg.from.id.toString();
        const animeTitle = match[1].trim();

        try {
            const added = await CustomAnimeList.addAnimeToUserList(userId, animeTitle);

            if (added) {
                await bot.sendMessage(chatId, `✅ <b>"${animeTitle}"</b> added to your custom list!\n\n━━━━━━━━━━━━━━━━━━━\n<b>Powered by @TeamXpirates</b>\n━━━━━━━━━━━━━━━━━━━`, { parse_mode: 'HTML' });
            } else {
                await bot.sendMessage(chatId, `🔖 <b>"${animeTitle}"</b> is already in your custom list.\n\n━━━━━━━━━━━━━━━━━━━\n<b>Powered by @TeamXpirates</b>\n━━━━━━━━━━━━━━━━━━━`, { parse_mode: 'HTML' });
            }
            await deleteCommandMessage(bot, chatId, messageId);
        } catch (error) {
            console.error('Error adding anime:', error);
            await bot.sendMessage(chatId, '❌ Error adding anime to your list. Please try again.');
            await deleteCommandMessage(bot, chatId, messageId);
        }
    });

    bot.onText(/\/removeanime (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const isAdmin = await checkAdmin(bot, msg, chatId);
        if (!isAdmin) return;
        const messageId = msg.message_id;
        const userId = msg.from.id.toString();
        const animeTitle = match[1].trim();

        try {
            const removed = await CustomAnimeList.removeAnimeFromUserList(userId, animeTitle);

            if (removed) {
                await bot.sendMessage(chatId, `🗑️ <b>"${animeTitle}"</b> removed from your custom list!\n\n━━━━━━━━━━━━━━━━━━━\n<b>Powered by @TeamXpirates</b>\n━━━━━━━━━━━━━━━━━━━`, { parse_mode: 'HTML' });
            } else {
                await bot.sendMessage(chatId, `❌ <b>"${animeTitle}"</b> not found in your custom list.\n\n━━━━━━━━━━━━━━━━━━━\n<b>Powered by @TeamXpirates</b>\n━━━━━━━━━━━━━━━━━━━`, { parse_mode: 'HTML' });
            }
            await deleteCommandMessage(bot, chatId, messageId);
        } catch (error) {
            console.error('Error removing anime:', error);
            await bot.sendMessage(chatId, '❌ Error removing anime from your list. Please try again.');
            await deleteCommandMessage(bot, chatId, messageId);
        }
    });

    bot.onText(/\/mylist/, async (msg) => {
        const chatId = msg.chat.id;
        const isAdmin = await checkAdmin(bot, msg, chatId);
        if (!isAdmin) return;
        const messageId = msg.message_id;
        const userId = msg.from.id.toString();

        try {
            const customList = await CustomAnimeList.getUserCustomList(userId);

            if (customList.length === 0) {
                await bot.sendMessage(chatId, '🔖 Your custom anime list is empty!\n\nUse /addanime <title> to add anime.\n\n━━━━━━━━━━━━━━━━━━━\n🏮 <b>Powered by @TeamXpirates</b> 🏮\n━━━━━━━━━━━━━━━━━━━', { parse_mode: 'HTML' });
                await deleteCommandMessage(bot, chatId, messageId);
                return;
            }

            let message = '<b>YOUR CUSTOM ANIME LIST</b>\n━━━━━━━━━━━━━━━━━━━\n';
            customList.forEach((anime, index) => {
                message += `${index + 1}. <b>${anime}</b>\n`;
            });
            message += `━━━━━━━━━━━━━━━━━━━\n<i>📊 Total: <b>${customList.length}</b> anime</i>\n<blockquote><b>Powered by @TeamXpirates</b></blockquote>\n`;

            if (message.length > 1000) {
                await sendLongMessage(bot, chatId, message, { parse_mode: "HTML" });
            } else {
                await bot.sendPhoto(chatId, LIST_IMAGE, {
                    caption: message,
                    parse_mode: "HTML"
                });
            }

            await deleteCommandMessage(bot, chatId, messageId);
        } catch (error) {
            console.error('Error fetching custom list:', error);
            await bot.sendMessage(chatId, '❌ Error fetching your custom list. Please try again.');
            await deleteCommandMessage(bot, chatId, messageId);
        }
    });

    bot.onText(/\/clearlist/, async (msg) => {
        const chatId = msg.chat.id;
        const isAdmin = await checkAdmin(bot, msg, chatId);
        if (!isAdmin) return;
        const messageId = msg.message_id;
        const userId = msg.from.id.toString();

        try {
            const cleared = await CustomAnimeList.clearUserList(userId);

            if (cleared) {
                await bot.sendMessage(chatId, '🗑️ <b>Your custom anime list has been cleared!</b>\n\n━━━━━━━━━━━━━━━━━━━\n🏮 <b>Powered by @TeamXpirates</b> 🏮\n━━━━━━━━━━━━━━━━━━━', { parse_mode: 'HTML' });
            } else {
                await bot.sendMessage(chatId, '🔖 Your custom list is already empty.\n\n━━━━━━━━━━━━━━━━━━━\n🏮 <b>Powered by @TeamXpirates</b> 🏮\n━━━━━━━━━━━━━━━━━━━', { parse_mode: 'HTML' });
            }
            await deleteCommandMessage(bot, chatId, messageId);
        } catch (error) {
            console.error('Error clearing list:', error);
            await bot.sendMessage(chatId, '❌ Error clearing your list. Please try again.');
            await deleteCommandMessage(bot, chatId, messageId);
        }
    });
}

async function checkAdmin(bot, msg, chatId) {
    const userId = String(msg.from.id); // Corrected
    const adminIds = Config.ADMIN_IDS.split(',');

    if (!adminIds.includes(userId)) {
        await bot.sendMessage(chatId, "❌ You are not an admin");
        return false;
    }
    return true;
}

async function sendAnimeSchedule(bot, chatId, day, displayName) {
    let fetchingMsg;
    try {
        fetchingMsg = await bot.sendMessage(chatId, '⏳ Fetching anime schedule...');

        const animeList = await AnimeSchedule.getAnimeByDay(day);
        const message = `<b><u>📅 ANIME SCHEDULE - ${displayName.toUpperCase()} BY: @TEAMXPIRATES</u></b>\n\n${AnimeSchedule.formatAnimeList(animeList)}`;

        if (message.length > 1000) {
            await sendLongMessage(bot, chatId, message, { parse_mode: 'HTML' });
        } else {
            await bot.sendPhoto(chatId, LIST_IMAGE, {
                caption: message,
                parse_mode: 'HTML'
            });
        }

        await deleteCommandMessage(bot, chatId, fetchingMsg.message_id);
    } catch (error) {
        console.error(`Error fetching ${day} schedule:`, error);
        await bot.sendMessage(chatId, '❌ Error fetching anime schedule. Please try again later.');
        if (fetchingMsg) {
            await deleteCommandMessage(bot, chatId, fetchingMsg.message_id);
        }
    }
}