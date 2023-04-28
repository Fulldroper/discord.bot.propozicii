module.exports.info = {
  "name": "offer",
  "type": 1,
  "dm_permission": false,
  "description": "Створити пропозицію",
  "options": [{
    "name": "text",
    "description": "Текст пропозиції (мінімум 15 символів)",
    "type": 3,
    "min_length": 15,
    "max_length": 741,
    "required": true
  },
  {
    "name": "image",
    "description": "Додадкове зображення до пропозиції",
    "type": 11,
    "channel_types": 0,
    "required": false
  },
  {
    "name": "tag",
    "description": "Додати тег до пропозиції (із наявних)",
    "type": 3,
    "channel_types": 0,
    "autocomplete": true,
    "required": false
  }]
}

const exploit = "||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||_ _ _ _ _ _ _ "

const editPost = async function(interaction, reply, owner) {
  const {
    Administrator
  } = this.perm.Flags

  const u = new this.perm(interaction.member.permissions)

  // check if has admin permissions or owner of offer
  if (
    interaction.member.user.id !== owner &&
    !u.has(Administrator)
    ) return await reply.send({
    type: 4,
    flags: 64,
    content: 'Редагування дозволено тільки власнику публікації та адмнінстрації з правом `ADMINISTRATOR`'
  })
  
  await reply.send({
    type: 9,
    data: {
      "title": "Редагування пропозиціїl",
      "custom_id": `offer:edit:${owner}`,
      "components": [{
        "type": 1,
        "components": [{
          "type": 4,
          "custom_id": "content",
          "label": "Текст пропозиції",
          "style": 2,
          "min_length": 15,
          "max_length": 741,
          "placeholder": "Введіть ваш текст",
          "value": interaction.message.content.split(exploit)[0],
          "required": true
        }]
      }]
    },
  })
};

const closePost = async function(interaction, reply, owner) {
  // defer answer
  reply.send({
    type: 6
  })

  const {
    Administrator
  } = this.perm.Flags

  const u = new this.perm(interaction.member.permissions)

  // check if has admin permissions
  if (!u.has(Administrator)) return await reply.send({
    type: 4,
    flags: 64,
    content: 'Команда дозволена тільки адміністрації, ви маєте мати право `ADMINISTRATOR`'
  })

  // import data from database
  const {
    channel = false, tags = false, alert = false, webhook = false
  } = await this.db.get(`${this.collection}:${interaction.guild_id}`) || {}

  // parce type of command
  const type = this.meta[1]

  // check if channel is exist
  const ch = await this.axios.get(this.api.getChannel(channel), {
    headers: {
      Authorization: `Bot ${this.token}`,
    }
  }).then(r => r.data).catch(() => {}) || false 

  if (!ch)  return await reply.send({
    type: 4,
    flags: 64,
    content: '❌ Канал для пропозицій не існує. Виконайте команду `/init` (тільки для адміністрації)'
  })

  // edit message
  await this.axios.patch(webhook + `/messages/${interaction.channel_id}` + `?thread_id=${interaction.channel_id}`, {
    content: interaction.message.content,
    thread_id: interaction.message.id,
    username: interaction.message.author.username,
    avatar_url: `https://cdn.discordapp.com/avatars/${this.meta[2]}/${interaction.message.author.avatar}.png`,
    components: [
      {
        type: 1,
        components: [
          {
            "type": 2,
            "style": 2,
            "emoji": { "name": "❔" },
            "label": "Інформація про автора",
            "custom_id": `offer:info:${this.meta[2]}`
          }
        ]
      }
    ]
  }, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  }).catch(this.error)
  
  // edit thread
  const filtered = interaction.channel?.applied_tags?.filter(t => !(Object.values(tags).includes(t))) || [];

  // add applied tags to message
  await this.axios.patch(this.api.editChannel(interaction.channel_id), {
    applied_tags: [tags[type], ...filtered]
  }, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  }).catch(console.log)

  const content = `Пропозиція була ${type === 'accept' ?  'прийнята' : 'відхилена'} адміністратором <@${interaction.member.user.id}>`
  
  // send alert in thread
  await this.axios.post(this.api.sendMessage(interaction.channel_id), { content }, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  })

  // alert to dm
  if (alert) {
    await this.axios.post(this.api.createDM, { 
      recipient_id: this.meta[2]
    }, {
      headers: {
        "Authorization": `Bot ${this.token}`
      }
    }).then(async ({data}) => {
      await this.axios.post(this.api.sendMessage(data.id), { 
        content, components:[{
          type: 1,
          components: [{
            type: 2,
            style: 5,
            label: "Ваша пропозиція",
            emoji: { name: "📑"},
            url: `https://canary.discord.com/channels/${interaction.guild_id}/${interaction.channel_id}/${interaction.channel_id}`
          }]
        }]
      }, {
        headers: {
          "Authorization": `Bot ${this.token}`
        }
      })
    })
    
  }
  // increment stats
  const global_score = await this.db.obj.get(`${this.collection}:stats:${type}:${interaction.member.user.id}`) || 0;
  const local_score = await this.db.obj.get(`${this.collection}:${interaction.guild_id}:stats:${type}:${interaction.member.user.id}`) || 0;
  await this.db.obj.set(`${this.collection}:stats:${type}:${interaction.member.user.id}`, Number(global_score) + 1);
  await this.db.obj.set(`${this.collection}:${interaction.guild_id}:stats:${type}:${interaction.member.user.id}`, Number(local_score) + 1);
}
// add thread tag & archive
const memberStats = async function(interaction, reply, owner) {
  // Acknowledge the interaction with a "deferred" response
  reply.send({ 
    type: 4,
    data: {
      content: "Іде збір інформації...",
      flags: 64, // ephemeral flag
    }
  });
  const global_score_accept = await this.db.obj.get(`${this.collection}:stats:accept:${owner}`) || 0;
  const global_score_deny = await this.db.obj.get(`${this.collection}:stats:deny:${owner}`) || 0;
  const local_score_accept = await this.db.obj.get(`${this.collection}:${interaction.guild_id}:stats:accept:${owner}`) || 0;
  const local_score_deny = await this.db.obj.get(`${this.collection}:${interaction.guild_id}:stats:deny:${owner}`) || 0;

  return await this.axios.patch(this.api.replyOnDefer(interaction.application_id, interaction.token),{
    type: 4,
    flags: 64,
    content: `🌎 __**Статистика міжсерверна**__\n\n> • Схвалено **${global_score_accept}**\n> ◦ Відхилено **${global_score_deny}**\n\n🏡 __**Статистика на поточному**__\n\n> • Схвалено **${local_score_accept}**\n> ◦ Відхилено **${local_score_deny}**\n\n__Користувача <@${owner}>__`
  })
}

module.exports.run = async function (interaction, reply) {
  // import data from database
  const {
    channel = false, rate_limit = 0, webhook = false, mention = false, tags = false
  } = await this.db.get(`${this.collection}:${interaction.guild_id}`) || {};
  
  // @@@ rate_limit
  const rate_limit_id = `${this.collection}:${interaction.guild_id}:${interaction.member.user.id}`
  let urate = new Date().getTime() - Number(await this.db.obj.get(rate_limit_id) || 0)
  if (urate <= rate_limit) {
    return await reply.send({
      type: 4, data: {
        content: `Ви використовуєте команду занадто часто, дозволено через **${Math.trunc((rate_limit - urate) / 1000)} сек.**`,
        flags: 64, // ephemeral flag
      }
    });
  } else this.db.obj.set(rate_limit_id, new Date().getTime());

  // check if channel is created
  if (!channel) return await reply.send({
    type: 4, data: {
      content: '❌ Канал для пропозицій за замовчуванням не встановлено. Виконайте команду `/init` (тільки для адміністрації)',
      flags: 64, // ephemeral flag
    }
  });

  // get the channel
  const ch = await this.axios.get(this.api.getChannel(channel), {
    headers: {
      Authorization: `Bot ${this.token}`,
    }
  }).then(r => r.data).catch(() => {}) || false 

  // check if channel is exist
  if (!ch) return await reply.send({
    type: 4, data: {
      content: '❌ Канал для пропозицій не існує. Виконайте команду `/init` (тільки для адміністрації)',
      flags: 64, // ephemeral flag
    }
  })
  
  // Acknowledge the interaction with a "deferred" response
  reply.send({ 
    type: 4,
    data: {
      content: "Іде створення...",
      flags: 64, // ephemeral flag
    }
  });
  // import values from command
  let content = interaction.data?.options?.text || false
  const { id: uid, avatar: uavatar, username, discriminator: utag} = interaction.member.user
  const { avatar: mavatar, nick} = interaction.member
  
  const uavatarURL = `https://cdn.discordapp.com/avatars/${uid}/${uavatar}.png`
  const mavatarURL = `https://cdn.discordapp.com/avatars/${uid}/${mavatar}.png`

  // send offer
  const message = {
    thread_name: content.slice(0, 100 - 3) + '...',
    avatar_url: mavatar ? mavatarURL : uavatarURL, 
    // mention if setup it
    content: mention ? `<@&${mention}>, ` + content : content, 
    username: nick || username,
    "attachments": [],
    "components": [{
      "type": 1,
      "components": [
        {
          "type": 2,
          "style": 1,
          "emoji": { "name": "📝" },
          "custom_id": `offer:edit:${uid}`
        },
        {
          "type": 2,
          "style": 3,
          // "emoji": { "name": "✅" },
          "label": "Схвалити",
          "custom_id": `offer:accept:${uid}`
        }, {
          "type": 2,
          "style": 4,
          // "emoji": { "name": "❌" },
          "label": "Відхилити",
          "custom_id": `offer:deny:${uid}`
        }, {
          "type": 2,
          "style": 2,
          "emoji": { "name": "❔" },
          "custom_id": `offer:info:${uid}`
        }
      ]
    }],
  }
  // parse and add media
  const media = interaction.data?.resolved?.attachments[interaction.data?.options?.image]?.url || false
  
  // if have attachment add to message
  media && (message.content += exploit + media)

  // execute webhook
  const { id } = await this.axios.post(webhook + `?wait=true`, message, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  }).then(r => r.data).catch(this.error) || false

  message.applied_tags = [tags.wait],
  interaction.data?.options?.tag && message.applied_tags.push(interaction.data.options.tag)
  // add applied tags to message
  await this.axios.patch(this.api.editChannel(id), message, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  }).catch(() => 0)

  // react on message
  await this.axios.put(this.api.createReaction(id, id, "✅"), {}, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  }).catch(this.error)

  await this.sleep(3000)
  
  await this.axios.put(this.api.createReaction(id, id, "❌"), {}, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  }).catch(this.error)

  // aswer to req
  return await this.axios.patch(this.api.replyOnDefer(interaction.application_id, interaction.token),{
    content: `Ваша пропозиція успішно створена`,    
    flags: 64,
    components:[{
      type: 1,
      components: [{
        type: 2,
        style: 5,
        label: "Ваша пропозиція",
        emoji: { name: "📑"},
        url: `https://canary.discord.com/channels/${interaction.guild_id}/${id}/${id}`
      }]
    }],
  }, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  })
}
// connect buttons
module.exports.component = async function (interaction, reply) {
  switch (this.meta[1]) {
    case "edit": editPost.call(this, interaction, reply, this.meta[2]); break;
    case "info": memberStats.call(this, interaction, reply, this.meta[2]); break;
    case "accept": closePost.call(this, interaction, reply, this.meta[2]); break;
    case "deny": closePost.call(this, interaction, reply, this.meta[2]); break;
    
    default:break;
  }
}
// autocomplete module
module.exports.autocomplete = async function(interaction, reply) {

  let input = interaction.data.options.tag
  let {
    channel = false, tags = []
  } = await this.db.get(`${this.collection}:${interaction.guild_id}`) || {}

  tags = Object.values(tags)

  if (!channel) return;

  const choices = (await this.axios.get(this.api.getChannel(channel), {
    headers: {
      'Authorization': `Bot ${process.env.TOKEN}`
    }
  }))?.data?.available_tags?.map(({ name, id: value }) => ({ name, value })) || []
 
  const customFilter = str => {
    if (tags.includes(str.value)) return false
    if (!input) return true
    str.name = str.name.toLowerCase()
    input = input.toLowerCase()
    return str.name.startsWith(input)
  }
  let filtered = choices.filter(customFilter)
  if(!filtered) return;
  if(filtered.length > 20) filtered = filtered.slice(0,20)

  return await reply.send({
    type: 8,
    data: {
      choices: filtered
    }
  })
}
// modal module
module.exports.modal = async function (interaction, reply) {
  const new_text = interaction.data.components[0].components[0].value
  const old = interaction.message.content.split(exploit)

  // import data from database
  const {
    alert = false, webhook = false
  } = await this.db.get(`${this.collection}:${interaction.guild_id}`) || {}
  // edit message
  await this.axios.patch(webhook + `/messages/${interaction.channel_id}` + `?thread_id=${interaction.channel_id}`, {
    content: new_text + exploit + old[1],
    thread_id: interaction.message.id,
    username: interaction.message.author.username,
    avatar_url: `https://cdn.discordapp.com/avatars/${this.meta[2]}/${interaction.message.author.avatar}.png`,
  }, {
    headers: {
      "Authorization": `Bot ${this.token}`
    }
  }).catch(this.error)
  
  const msg = {
    "embeds": [
        {
            "fields": [],
            "title": "Попередній зміст",
            "description": old[0],
            "color": 14554694,
            "footer": {
              "icon_url": `https://cdn.discordapp.com/avatars/${interaction.message.author.id}/${interaction.message.author.avatar}.png`,
              "text": `Автор: ${interaction.message.author.username}`
            }
        },
        {
            "fields": [],
            "title": "Новий зміст",
            "description": new_text,
            "color": 1498750,
            "footer": {
              "icon_url": `https://cdn.discordapp.com/avatars/${interaction.member.user.id}/${interaction.member.user.avatar}.png`,
              "text": `Автор: ${interaction.member?.nick || interaction.member.user.username}`
            }
        }
    ],
    "components": [],
    "content": `# Пропозицію було змінено`
  }

  await reply.send({
    type: 4,
    data: msg
  })

  // alert to dm
  if (alert) {
    await this.axios.post(this.api.createDM, { 
      recipient_id: this.meta[2]
    }, {
      headers: {
        "Authorization": `Bot ${this.token}`
      }
    }).then(async ({data}) => {
      await this.axios.post(this.api.sendMessage(data.id), msg, {
        headers: {
          "Authorization": `Bot ${this.token}`
        }
      })
    })
    
  }

  return console.log(msg)
}