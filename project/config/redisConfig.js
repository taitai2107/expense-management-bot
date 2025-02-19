const { createClient } = require('redis');

class RedisConfig {
    static client = null;
    static data = {
        password: process.env["REDIS_PASS"],
        socket: {
            host: process.env["REDIS_HOST"],
            port: process.env["REDIS_PORT"],
        },
    };
    static async init() {
        if (!this.client) {
            this.client = createClient(this.data);

            this.client.on('error', (err) => console.error('❌ Redis Error:', err));

            await this.client.connect();
            console.log('🚀 Redis connected successfully!');
        }
    }

    static getClient() {
        if (!this.client) throw new Error('Redis client has not been initialized');
        return this.client;
    }
}

module.exports = RedisConfig;
