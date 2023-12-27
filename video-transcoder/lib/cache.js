const Redis = require("ioredis");
const { REDIS_KEYS } = require("../constants/const");
const redis = new Redis(process.env.REDIS_URL);

async function enqueueJobInQueue(job) {
  return await redis.lpush(
    REDIS_KEYS.VIDEO_TRANSCODING_QUEUE,
    JSON.stringify(job)
  );
}
async function dequeueJobFromQueue() {
  const job = await redis.rpop(REDIS_KEYS.VIDEO_TRANSCODING_QUEUE);
  return job ? JSON.parse(job) : null;
}

const getKey = async (key) => {
  return await redis.get(key);
};

const deleteKey = async (key) => {
  return await redis.del(key);
};

const setKey = async (key, value, expire = 0, setIfNotExist = false) => {
  let params = [key, value];
  if (expire > 0) params.push("EX", expire);
  if (setIfNotExist) params.push("NX");

  // console.log("command : SET ", params);
  let response = await client.sendCommand("SET", params);

  if (response) {
    console.log(key + " set to => " + value);
    return true;
  } else return false;
};

const increment = async (key) => {
  let value = await client.incr(key);
  console.log("incremented key : ", key, " value : ", value);
  return value;
};

const decrement = async (key) => {
  let value = await client.decr(key);
  console.log("decremented key : ", key, " value : ", value);
  return value;
};

module.exports = {
  enqueueJobInQueue,
  dequeueJobFromQueue,
  getKey,
  deleteKey,
  setKey,
  increment,
  decrement,
};
