module.exports.info = {
  "name": "init",
  "dm_permission": false,
  "type": 1,
  "description": "Налаштування бота",
  "options": [
    {
      "name": "name",
      "description": "Вкажіть назву каналу який буде створено для пропозицій",
      "type": 3,
      "required": false
    },
    {
      "name": "channel",
      "description": "Вкажіть канал який вже створено для пропозицій",
      "type": 7,
      "channel_types": [15],
      "required": false
    },
    {
      "name": "alert",
      "description": "Вказати чи будуть автори пропозицій отримувати сповіщення? (Так або Ні)",
      "type": 5,
      "required": false
    },
    {
      "name": "rate_limit",
      "description": "кількість секунд, яку користувач повинен чекати, перш ніж надіслати інше повідомлення (до 21600)",
      "type": 4,
      "min_value": 0,
      "max_value": 21600000,
      "choices": [
        { "name": "15 секунд", "value": 5000 },
        { "name": "30 секунд", "value": 30000 },
        { "name": "1 хвилина", "value": 60000 },
        { "name": "10 хвилин", "value": 600000 },
        { "name": "30 хвилин", "value": 1800000 },
        { "name": "1 година", "value": 3600000 },
        { "name": "6 годин", "value": 21600000 },
      ],
      "required": false
    },
    {
      "name": "mention",
      "description": "Вкажіть роль яка буде згадуватися при створенні нової пропозиції (не обов'язково)",
      "type": 8,
      "required": false
    }
  ]
}

module.exports.run = async function(interaction, reply) {
  const {
    Administrator,
    SendMessages,
    ManageChannels,
    AddReactions,
    ViewChannel,
    ManageWebhooks,
  } = this.perm.Flags

  // interaction.app_permissions
  // interaction.member.permissions
  
  
  // Check if the bot has the "Administrator" permission in the server
  const mePerm = new this.perm(interaction.app_permissions)
  const _channel = interaction.data.options?.channel ? interaction.data.resolved.channels[interaction.data.options?.channel] : false
  const channelPerm = interaction.data.options?.channel ? new this.perm(_channel.permissions) : false
  
  // Check if the user who triggered the interaction has the "Administrator" permission
  // If not, send a reply indicating that the command is only available to administrators
  if (!new this.perm(interaction.member.permissions).has(Administrator)) return await reply.send({
    type: 4, data: {
      content: 'Команда дозволена тільки адміністрації, ви маєте мати право `ADMINISTRATOR`',
      flags: 64, // ephemeral flag
    }
  });
  
  if (!channelPerm && !interaction.data.options?.name) return await reply.send({
    type: 4, data: {
      content: 'Не вказано ні один варіант \n`name`- назва нового каналу\n`channel` - існуючий форум\n\n**Для налаштування спробуйте знову**',
      flags: 64, // ephemeral flag
    }
  })

  let content = ''
  // If the bot doesn't have the "Administrator" permission, check for other necessary permissions
  mePerm.has(SendMessages)   || (content += '`SendMessages` ')
  mePerm.has(ManageChannels) || (content += '`ManageChannels` ')
  mePerm.has(AddReactions)   || (content += '`AddReactions` ')
  mePerm.has(ViewChannel)    || (content += '`ViewChannel` ')
  mePerm.has(ManageWebhooks) || (content += '`ManageWebhooks` ')
  
  if (content.length > 0) return await reply.send({
    type: 4, data: {
      content: 'Для роботи потрібний дозвіл на наступне право:\n' + content,
      flags: 64, // ephemeral flag
    }
  })
  

  // Setup channel
  let channel
  
  const premAll = new this.perm()
  const premMe = new this.perm("268436496")
  
  premAll.add(SendMessages)
  
  const chConfig = {
    "name": interaction.data.options?.name || _channel.name,
    "type": 15,
    "default_sort_order": 1,
    "default_forum_layout": 1,
    "default_auto_archive_duration": 10080,
    "available_tags": [
      { "name": "На розгляді", "emoji_name":  "👀" },
      { "name": "Прийнято", "emoji_name": "✅" },
      { "name": "Відхилено", "emoji_name": "❌" },
    ],
    "permission_overwrites": [
      {
        "id": interaction.guild_id,
        "type": 0,
        "deny": premAll.bitfield.toString(),
      },
      {
        "id": this.me.id,
        "type": 1,
        "allow": premMe.bitfield.toString(),
      },
    ]
  }

  // Acknowledge the interaction with a "deferred" response
  reply.send({ 
    type: 5,
    data: {
      flags: 64, // ephemeral flag
    }
  });

  if (channelPerm) {
    // edit channel
    channel = await this.axios.patch(this.api.editChannel(interaction.data.options?.channel), chConfig, {
      headers: {
        Authorization: `Bot ${this.token}`,
        "Content-Type": "application/json",
      }
    }).then(r => r.data).catch(() => {}) || false
    if (!channel) return await this.axios.patch(this.api.replyOnDefer(interaction.application_id, interaction.token), {
      "content": "На каналі заборонено зміну, впевніться що наступні правила дозволені: `Дивитися канал`, `Керувати каналом`, `Керування дозволами`",
      "flags": 64, // ephemeral flag
    }, {
      headers: {
        Authorization: `Bot ${this.token}`,
        "Content-Type": "application/json",
      }
    });
  } else {
    // create channel
    channel = await this.axios.post(this.api.createChannel(interaction.guild_id), chConfig, {
      headers: {
        Authorization: `Bot ${this.token}`,
        "Content-Type": "application/json",
      }
    }).then(r => r.data).catch(console.log) || false
  }

  // saving tags ids
  const tags = {}
  const { available_tags, id: chid } = channel
  for (const tag of available_tags) {
    const lib = {
      'На розгляді': 'wait',
      'Прийнято': 'accept',
      'Відхилено': 'deny',
    }
    
    tags[
      lib[tag.name]
    ] = tag.id
  }
  console.log(this.me);
  // rate_limit?.value && channel.channel.setRateLimitPerUser(rate_limit?.value || 0, "кількість секунд, яку користувач повинен чекати, перш ніж надіслати інше повідомлення")
  // creating webhook
  const _webhook = await this.axios.post(this.api.createWebhook(chid), {
    "name": this.me.username,
  }, {
    headers: {
      Authorization: `Bot ${this.token}`,
      "Content-Type": "application/json",
    }
  }).then(r => r.data).catch(console.log) || false

  if (!_webhook) return await this.axios.patch(this.api.replyOnDefer(interaction.application_id, interaction.token), {
    "content": "На каналі заборонено створювати вебхуки, впевніться що в правилах каналу наявний дозвіл `Керувати Webhook`",
    "flags": 64, // ephemeral flag
  }, {
    headers: {
      Authorization: `Bot ${this.token}`,
      "Content-Type": "application/json",
    }
  })
  
  // save the channel and alert settings to the database
  await this.db.set(`${this.collection}:${interaction.guild_id}`, {
    channel: channel.id,
    alert: interaction.data?.options?.alert || false,
    rate_limit: interaction.data?.options?.rate_limit || 0,
    mention: interaction.data?.options?.mention || 0,
    tags, webhook: this.api.sendWebhook(_webhook.id, _webhook.token)
  })

  // reply to the user with a success message and the settings that were applied
  this.axios.patch(this.api.replyOnDefer(interaction.application_id, interaction.token), {
    content: 
    `Налаштування завершено успішно\n\n- встановлено канал <#${
      channel.id
    }> для публікацій\n- сповіщення авторам публікацій ${
      interaction.data?.options?.alert ? '**Увімкнуто**' : '**Вимкнуто**'
    }\n - кількість секунд, яку користувач повинен чекати ${
      interaction.data?.options?.rate_limit ? `**${interaction.data?.options?.rate_limit} cек.**` : "**не встановлено**"
    }\n - згадування ролі ${
      interaction.data?.options?.mention ? `<@&${interaction.data?.options?.mention}> (якщо ви бачите тільки цифки, в налаштуванні ролі дозволити згадування)` : "**не встановлено**"
    }`,
    "flags": 64, // ephemeral flag
  }, {
    headers: {
      Authorization: `Bot ${this.token}`,
      "Content-Type": "application/json",
    }
  }).catch(this.error)
  return
}

