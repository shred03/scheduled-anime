import TelegramBot from 'node-telegram-bot-api';
import { setupCommands } from './commands/commands.js';
import Config from './config.js';
const bot = new TelegramBot(Config.BOT_TOKEN, { polling: true });

setupCommands(bot);

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

console.log('Anime Schedule Bot started!');