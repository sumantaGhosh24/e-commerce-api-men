import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: retries => {
      console.log(`Retrying Redis... attempt ${retries}`);
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", err => console.log("Redis Error", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis connection successful!");
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
})();

export default redisClient;
