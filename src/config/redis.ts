import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", err => console.log("Redis Error", err));

(async () => {
  await redisClient.connect();
  console.log("Redis connection successful!");
})();

export default redisClient;
