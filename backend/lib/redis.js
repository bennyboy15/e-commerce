import { createClient } from "redis"
import { config } from "dotenv";

config();

const redis = createClient({
  url: process.env.UPSTASH_REDIS_URL
});

redis.on("error", function(err) {
  throw err;
});
await redis.connect()

export default redis;