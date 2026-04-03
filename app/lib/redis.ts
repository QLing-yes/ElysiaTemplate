import { RedisClient } from "bun";
import { logger } from "@/app/lib/logger";

/** redis客户端 */
const redis = new RedisClient(process.env.REDIS_URL);

redis.onconnect = () => logger.info("[redis] connected successfully");
redis.onclose = err => logger.error(`[redis] disconnected:${err}`);
redis.connect()// test connect

export default redis;
