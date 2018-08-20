import logger = require("winston")
import { getRedisClientAsync } from "../lib/redispool"
const [MessagesDbOpt] = [{ db: 6 }]
export async function getAccessToken(token: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(token), MessagesDbOpt)
}

export async function saveAccessToken(token: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(token, content, "ex", 60 * 60 * 2), MessagesDbOpt)
    } catch (e) {
        logger.error("saveWeather error", e.message)
    }
}
export async function getticket(ticket: string) {
    return await getRedisClientAsync(async rds => await rds.getAsync(ticket), MessagesDbOpt)
}

export async function saveticket(ticket: string, content: string) {
    try {
        await getRedisClientAsync(async rds => await rds.setAsync(ticket, content, "ex", 60 * 60 * 2), MessagesDbOpt)
    } catch (e) {
        logger.error("saveWeather error", e.message)
    }
}
