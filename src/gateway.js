// aplication runner
(async () => {
  console.log("Starting gateway")
  // env configuration
  process.env.NODE_ENV || await require('dotenv').config({ debug: false })

  // import environment
  const {
    TOKEN = false,
    AUTHOR_ID = false,
    ERROR_WEBHOOK_URL = false,
    REDIS_URL = false,
    PORT = 1337,
    HOST = '0.0.0.0',
    ENTERPOINT = "*",    
    DEBUG = false,
    PUBLICKEY = false,
    PATH_CERT = "./ssl/certificate.crt",
    PATH_KEY = "./ssl/private.key",
    PATH_CA = "./ssl/ca_bundle.crt",
    PATH_METHODS = "src/methods/",
    PATH_COMMANDS = "src/commands/",
    GATEWAY = "discord.com",
    GATEWAY_VERSION = 9,
    DB_COLLECTION = "test-propozicii"
  } = process.env

  // import dependencies
  const { existsSync, readFileSync } = await require("node:fs")
  const nacl = await require('tweetnacl');
  const importer = await require('fd-importer');
  const db = new (await require("fd-redis-api"))(REDIS_URL)
  const metods = await importer(PATH_METHODS, { debug: DEBUG })
  const { error, log } = metods
  const commands = await importer(PATH_COMMANDS, { debug: DEBUG })
  const TYPES = ["♥","ack", "run", "component", "autocomplete", "modal"]
  const axios = require("axios").default
  const api = {
    /**
     * @method `GET`
     */
    me: `https://${GATEWAY}/api/v${GATEWAY_VERSION}/users/@me`,
    /**
     * 
     * @param {*} channelId 
     * @method `PATCH` 
     */
    editChannel: channelId => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/channels/${channelId}`,
    /**
     * 
     * @param {*} channelId 
     * @param {*} messageId 
     * @method `PATCH`
     */
    editMessage: (channelId, messageId) => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/channels/${channelId}/messages/${messageId}`,
    /**
     * 
     * @param {*} webhookId 
     * @param {*} token 
     * @param {*} messageId 
     * @method `PATCH` 
     */
    editWebhookMessage: (webhookId, token, messageId) => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/webhooks/${webhookId}/${token}/messages/${messageId}`,

    /**
     * 
     * @param {*} webhookId 
     * @param {*} token 
     * @method `POST`
     */
    sendWebhook: (webhookId, token) => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/webhooks/${webhookId}/${token}`,
    /**
     * 
     * @param {*} channelId 
     * @method `POST`
     */
    sendMessage: channelId => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/channels/${channelId}/messages`,

    /**
     * 
     * @param {*} id 
     * @param {*} token 
     * @method `POST` 
     */
    createModal: (interactionId, token) => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/interactions/${interactionId}/${token}/callback`,
    /**
     * @method `POST`
     */
    createDM: `https://${GATEWAY}/api/v${GATEWAY_VERSION}/users/@me/channels`,
    /**
     * 
     * @param {*} guildId 
     * @method `POST` 
     */
    createChannel: guildId => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/guilds/${guildId}/channels`,
    /**
     * 
     * @param {*} channelId 
     * @method `POST` 
     */
    createWebhook: channelId => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/channels/${channelId}/webhooks`,
    /**
     * 
     * @param {*} channelId 
     * @param {*} messageId 
     * @param {*} emoji 
     * @method `PUT` 
     */
    createReaction: (channelId, messageId, emoji) => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/channels/${channelId}/messages/${messageId}/reactions/${emoji}/@me`,

    /**
     * 
     * @param {*} application_id 
     * @param {*} token 
     * @method `PATCH`
     */
    replyOnDefer: (application_id, token) => `https://${GATEWAY}/api/v${GATEWAY_VERSION}/webhooks/${application_id}/${token}/messages/@original`,
    /**
     * 
     * @param {*} channelId 
     * @method `GET`
     */
    getChannel: channelId =>  `https://${GATEWAY}/api/v${GATEWAY_VERSION}/channels/${channelId}`,
  }

  // create ineraction context
  const context = {
    db, ...metods, axios, api,
    master: AUTHOR_ID,
    token: TOKEN,
    perm: await require("./utils/PermissionsBitField"),
    collection: DB_COLLECTION
  }

  // check ssl sertificats and generate gateway options
  const gatewayOptions = { logger: DEBUG }

  if (await existsSync(PATH_CERT) && await existsSync(PATH_KEY) && await existsSync(PATH_CA)){
    try {
      gatewayOptions.https = { 
        key: await readFileSync(PATH_KEY),
        cert: await readFileSync(PATH_CERT),
        ca: await readFileSync(PATH_CA),
      }
    } catch (error) {
      errorHandler("SSL certificat and key can`t be imported", error)
    }
  }

  // setup gateway instance
  const gateway = await require("fastify")(gatewayOptions);

  // add entry point route
  gateway.post(ENTERPOINT, async ({ body, headers }, res) => {
    // close unverifided connection
    if(!nacl.sign.detached.verify(
      Buffer.from(headers["x-signature-timestamp"] + JSON.stringify(body)),
      Buffer.from(headers["x-signature-ed25519"], 'hex'),
      Buffer.from(PUBLICKEY, 'hex')
    )) return res.code(401).send();

    // ACK answer
    if (body?.type === 1) return res.code(200).send({ type: 1 });

    // execute interaction
    // parce info from id as array
    if (body?.data?.custom_id) context.meta = body.data.custom_id.split(":");
    // count type of interaction
    const type = TYPES[body.type]
    // interaction name
    const index = body?.data?.name || context?.meta[0] 
    // check if interaction exist and suport current type
    if (
      !commands[ index ] ||
      !commands[ index ][ type ]
    ) return res.code(200).send({})
    // reformat interaction options if exists
    if (body?.data?.options) {
      const options = {}
      body.data.options.forEach(option => options[option.name] = option.value);
      body.data.options = options
    }
    // run interaction with context
    try {
      return await commands[ index ][ type ].call(context, body, res)
    } catch (err) {
      error(err)
      return res.code(200).send({})
    }
  })

  // on ready server
  const ready = async (e) => {
    if (e) throw e;
    // connect to database
    await db.connect()
    // get own info
    context.me = await axios.get(api.me, {
      headers: {
        Authorization: `Bot ${TOKEN}`
      }
    }).then(r => r.data).catch(error) || undefined;
  }

  // Run the server!
  gateway.listen({ port: Number(PORT), host: String(HOST) }, ready)
})()