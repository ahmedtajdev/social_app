import { createClient, RedisArgument, RedisClientType } from "redis";
import { REDIS_URI } from "../../config.js";

export class CacheService {
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({ url: REDIS_URI });
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log(`Redis connected`);
    } catch (error) {
      console.log(`Fail to connect with Redis`);
    }
  }

  async set({
    key,
    value,
    ttl,
  }: {
    key: RedisArgument;
    value: number | RedisArgument;
    ttl?: number;
  }) {
    if (typeof value == "object") {
      value = JSON.stringify(value);
    }
    return await this.client.set(key, value, ttl ? { EX: ttl } : {});
  }

  async get({ key }: { key: RedisArgument }) {
    let value = await this.client.get(key);
    try {
      return JSON.parse(value as string);
    } catch (error) {
      return value;
    }
  }

  async exists({ key }: { key: RedisArgument }) {
    return await this.client.exists(key);
  }

  async update({
    key,
    value,
    ttl,
  }: {
    key: RedisArgument;
    value: number | RedisArgument;
    ttl?: number;
  }) {
    if (!(await this.exists({ key }))) {
      return 0;
    }
    return await this.set({ key, value, ttl: ttl as number });
  }

  async del({ keys }: { keys: RedisArgument | string[] }) {
    return await this.client.del(keys);
  }

  async keys({ prefix }: { prefix: RedisArgument }) {
    return await this.client.keys(`${prefix}*`);
  }

  async ttl({ key }: { key: RedisArgument }) {
    return await this.client.ttl(key);
  }

  async expire({ key, ttl }: { key: RedisArgument; ttl?: number }) {
    return await this.client.expire(key, ttl as number);
  }

  async incBy({ key, value = 1 }: { key: RedisArgument; value?: number }) {
    return await this.client.incrBy(key, value);
  }

  async decrBy({ key, value = 1 }: { key: RedisArgument; value?: number }) {
    return await this.client.decrBy(key, value);
  }
}

export default new CacheService();
