# Anime Schedule Telegram Bot

A Telegram bot that provides anime schedules and allows users to create custom anime lists.

## Features

- Get anime schedule for any day of the week
- View today's and tomorrow's anime schedule
- Create custom anime lists
- Filter schedules by custom lists
- Add/remove anime from personal lists

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your tokens to `.env`:
   - Get Telegram Bot Token from [@BotFather](https://t.me/botfather)
   - Get AnimeSchedule API token from [animeschedule.net](https://animeschedule.net)

4. Run the bot:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Bot Commands

- `/start` - Show welcome message and help
- `/help` - Show help message
- `/today` - Get today's anime schedule
- `/tomorrow` - Get tomorrow's anime schedule
- `/sunday`, `/monday`, etc. - Get specific day schedule
- `/cday <day>` - Get custom list anime for specific day
- `/addanime <title>` - Add anime to your custom list
- `/removeanime <title>` - Remove anime from custom list
- `/mylist` - View your custom anime list
- `/clearlist` - Clear your custom anime list

## File Structure

- `main.js` - Bot initialization
- `commands.js` - Command handlers
- `models.js` - Anime schedule API and data processing
- `custom.js` - Custom list management
- `custom_lists.json` - User custom lists storage (auto-generated)

## Environment Variables

- `BOT_TOKEN` - Your Telegram bot token
- `ANIMESCHEDULE_TOKEN` - Your AnimeSchedule API token