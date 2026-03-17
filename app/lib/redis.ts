import { RedisClient } from "bun";

const redis = new RedisClient(process.env.REDIS_URL);

export default redis;
