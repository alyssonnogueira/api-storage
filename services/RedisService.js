'use strict';

const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = class RedisService{

    constructor() {
        this.client = redis.createClient({
            host: "127.0.0.1",
            port: "6379",
            return_buffers : true
        });
    }

    async getKey(key){
        return JSON.parse(await this.client.getAsync(key));
    }

    async setKey(key, value){
        const ttl = 60 * 60 * 24 * 30;
        return await this.client.setAsync(key, JSON.stringify(value), 'EX', ttl);
    }

    async getKeyFile(key){
        return await this.client.getAsync(key);
    }

    async setKeyFile(key, value){
        const ttl = 60 * 60 * 24 * 30;
        return await this.client.setAsync(key, value, 'EX', ttl);
    }

    async deleteKey(key){
        return await this.client.delAsync(key);
    }

};