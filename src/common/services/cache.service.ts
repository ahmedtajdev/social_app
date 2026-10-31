import { RedisArgument } from "redis";
import { client } from "../../DB/redis.connection.js";

export const set = async ({
  key,
  value,
  ttl,
}: {
  key: RedisArgument;
  value: number | RedisArgument;
  ttl?: number;
}) => {
  if (typeof value == "object") {
    value = JSON.stringify(value);
  }
  return await client.set(key, value, { EX: ttl as number });
};

export const get = async ({ key }: { key: RedisArgument }) => {
  let value = await client.get(key);
  try {
    return JSON.parse(value as string);
  } catch (error) {
    return value;
  }
};

export const exists = async ({ key }: { key: RedisArgument }) => {
  return await client.exists(key);
};

export const update = async ({
  key,
  value,
  ttl,
}: {
  key: RedisArgument;
  value: number | RedisArgument;
  ttl?: number;
}) => {
  if (!(await exists({ key }))) {
    return 0;
  }
  return await set({ key, value, ttl: ttl as number });
};

export const del = async ({ keys }: { keys: RedisArgument | string[] }) => {
  return await client.del(keys);
};

export const keys = async ({ prefix }: { prefix: RedisArgument }) => {
  return await client.keys(`${prefix}*`);
};

export const ttl = async ({ key }: { key: RedisArgument }) => {
  return await client.ttl(key);
};

export const expire = async ({
  key,
  ttl,
}: {
  key: RedisArgument;
  ttl?: number;
}) => {
  return await client.expire(key, ttl as number);
};

export const incBy = async ({
  key,
  value = 1,
}: {
  key: RedisArgument;
  value?: number;
}) => {
  return await client.incrBy(key, value);
};

export const decrBy = async ({
  key,
  value = 1,
}: {
  key: RedisArgument;
  value?: number;
}) => {
  return await client.decrBy(key, value);
};
