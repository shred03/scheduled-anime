import { configDotenv } from "dotenv";
configDotenv()

const Config = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    ANIMESCHEDULE_TOKEN: process.env.ANIMESCHEDULE_TOKEN,
    START_IMAGE: process.env.START_IMAGE,
    LIST_IMAGE: process.env.LIST_IMAGE,
    ADMIN_IDS: process.env.ADMIN_IDS,
}

export default Config