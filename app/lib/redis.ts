import { RedisClient } from "bun";

/** redis客户端 */
const redis = new RedisClient(process.env.REDIS_URL);

export default redis;
