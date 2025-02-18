const RedisConfig = require('../redisConfig');

class RedisClient {
    constructor() {
        this.client = RedisConfig.getClient();
    }

    async set(key, value, ttl = 3600) {
        try {
            await this.client.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error(`❌ Redis set Error: ${error}`);
        }
    }

    async get(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`❌ Redis get Error: ${error}`);
            return null;
        }
    }

    async delete(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`❌ Redis delete Error: ${error}`);
        }
    }
}

module.exports = RedisClient;
