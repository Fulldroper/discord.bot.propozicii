// aplication runner
(async () => {
  // env configuration
  process.env.NODE_ENV || await require('dotenv').config({ debug: false })
  // req discord framework
  const { Client, GatewayIntentBits } = await require('discord.js');  
  // init discord bot && rest obj
  const bot = new Client({ intents: [
    GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations
  ] });
  // catch errors
  const axios = await require("axios").default
  bot.log = (...x) => {
    console.log(...x)
    axios({
      method: 'post',
      url: process.env.ERROR_WEBHOOK_URL,
      headers:{
        "Content-Type": "multipart/form-data"
      },
      data: { 
        content:`\`\`\`js\n${x?.stack || x.join("")}\`\`\``,
        username: this?.user?.username || process.env.npm_package_name,
        avatar_url: this?.user?.avatarURL() || ''
      }
    })
  }
  bot.error = (x) => {
    console.log(x)
    axios({
      method: 'post',
      url: process.env.ERROR_WEBHOOK_URL,
      headers:{
        "Content-Type": "multipart/form-data"
      },
      data: { 
        content:`\`\`\`js\n${x?.stack || x}\`\`\``,
        username: this?.user?.username || process.env.npm_package_name,
        avatar_url: this?.user?.avatarURL() || ''
      }
    })
  }
  bot.descriptionBuilder = text => {
    let description = text
    for (const m of text.matchAll(/\$[a-z]{1,32}/gm)) {
      const c = m[0].slice(1)
      if (_cmds[c]) {
        _description = _description.replaceAll(m[0],`</${c}:${_cmds[c]}>`)
      }
    }

  }
  bot.on("error", bot.error)
  // run bot
  bot.login(process.env.TOKEN)
  bot.on("ready", async function () {
    // add command builder
    await require("fd-dcc").call(this)
    // create site
    require("fd-dsite").call(this)
    // add desctiption manager
    await require("fd-desc-changer").call(this)
    // change bot description
    this.description = process.env.npm_package_config_description
    // add and connect to db
    this.db = new (require("fd-redis-api"))(process.env.REDIS_URL)
    this.db.onError(this.error)
    await this.db.connect()
    // calc count of users
    this.users_counter = this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
    
    // change bot description
    this.description = process.env.npm_package_config_description
    // log statistic
    this.log(
      `🚀 Start as ${this.user.tag} at`, new Date,
      `\n📊 Servers:`,this.guilds.cache.size,` Users:`, this.users_counter || 0,` Commands:`, Object.keys(this.commands).length,
      `\n📜 Description: \n\t+ ${process.env.npm_package_config_description} \n\t- ${await this.description}`,
      `\n🗃️  Commands:`, Object.keys(this.commands)
    )
  })
})()