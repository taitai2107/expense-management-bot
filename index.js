const Bot = require("./bot");
const RedisConfig = require("./project/config/redisConfig")
const {testConnect} = require("./project/config/connect");
const e = require("dotenv")
e.config()
const API_KEY = process.env.API_KEY;
RedisConfig.init()
if (!API_KEY) {
    console.error("API Key không được cấu hình.");
    process.exit(1);
}
(async () => {
    await testConnect();
})();
const bot = new Bot(API_KEY);


bot.start();
