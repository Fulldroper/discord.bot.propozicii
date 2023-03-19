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

module.exports.run = async function(interaction) {
  // Get the values of the "name", "channel", and "alert" options from the interaction
  const name = interaction.options.get("name")
  const channel = interaction.options.get("channel")
  const alert = interaction.options.get("alert")
  const rate_limit = interaction.options.get("rate_limit")
  const mention = interaction.options.get("mention")
  // Check if the user who triggered the interaction has the "Administrator" permission
  if (!interaction.member.permissions.serialize().Administrator) {
    // If not, send a reply indicating that the command is only available to administrators
    interaction.reply({ content: 'Команда дозволена тільки адміністрації, ви маєте мати право `ADMINISTRATOR`', ephemeral: true })
    return
  }
  // Check if the bot has the "Administrator" permission in the server
  const mePerm = interaction.guild.members.me.permissions.toArray()

  if (!mePerm.includes("Administrator")) {
    let content = ''
    // If the bot doesn't have the "Administrator" permission, check for other necessary permissions
    mePerm.includes('SendMessages')   || (content += '\n`SendMessages`')
    mePerm.includes('ManageChannels') || (content += '\n`ManageChannels`')
    mePerm.includes('AddReactions')   || (content += '\n`AddReactions`')
    mePerm.includes('ViewChannel')    || (content += '\n`ViewChannel`')
    mePerm.includes('ManageChannels') || (content += '\n`ManageChannels`')
    mePerm.includes('ManageWebhooks') || (content += '\n`ManageWebhooks`')

    if (content.length > 0) {
      // If the bot doesn't have the necessary permissions, send a reply indicating which permissions are required
      interaction.reply({content: 'Для роботи потрібний дозвіл на наступне право:\n' + content, ephemeral: true})
      return
    }
  }
  
  if (channel) {
    // if no name is provided but a channel is, set permissions for the channel
    // to prevent the "everyone" role from sending messages, and allow the bot to send messages
    const { availableTags } = await interaction.guild.channels.edit(channel.channel, {
      name: name?.value ? name?.value : channel.channel.name,
      type: 15,
      // rateLimitPerUser: rate_limit?.value || 0,
      availableTags: [
        { name: "На розгляді", emoji: { name: "👀" }},
        { name: "Прийнято", emoji: { name: "✅" }},
        { name: "Відхилено", emoji: { name: "❌" }},
      ],
      defaultSortOrder: 1,
      defaultForumLayout: 1,
      defaultAutoArchiveDuration: 10080,
      reason: "Налаштування каналу для публікації пропозицій",
      permissionOverwrites:[
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['SendMessages'],
        },
        {
          id: this.user.id,
          allow: ['SendMessages'],
        },
      ]
    });
    // saving tags ids
    let tags = {}
    for (const tag of availableTags) {
      const lib = {
        'На розгляді': 'wait',
        'Прийнято': 'accept',
        'Відхилено': 'deny',
      }
      
      tags[
        lib[tag.name]
      ] = tag.id
    }
    // rate_limit?.value && channel.channel.setRateLimitPerUser(rate_limit?.value || 0, "кількість секунд, яку користувач повинен чекати, перш ніж надіслати інше повідомлення")
    // creating webhook
    const webhook = (await channel.channel.createWebhook({
      name: this.user.username,
      avatar: await this.user.avatarURL(),
    }).catch(e => this.emit('error', e))).url
    // save the channel and alert settings to the database
    await this.db.set(`${this.collection}:${interaction.guildId}`,{
      channel: channel.value,
      alert: alert?.value || false,
      rate_limit: rate_limit?.value || 0,
      mention: mention?.value || 0,
      tags, webhook
    })
    // reply to the user with a success message and the settings that were applied
    interaction.reply({
      content: 
      `Налаштування завершено успішно\n\n- встановлено канал <#${
        channel.value
      }> для публікацій\n- сповіщення авторам публікацій ${
        alert?.value ? '**Увімкнуто**' : '**Вимкнуто**'
      }\n - кількість секунд, яку користувач повинен чекати ${
        rate_limit?.value ? `**${rate_limit?.value} cек.**` : "**не встановлено**"
      }\n - згадування ролі ${
        mention?.value ? `<@&${mention?.value}> (якщо ви бачите тільки цифки, в налаштуванні ролі дозволити згадування)` : "**не встановлено**"
      }`,
      ephemeral: true
    }).catch(e => this.emit('error', e))
    return
  } else if (name && !channel) {
    // if a name is provided but no channel is, create a new channel with the provided name
    // and set the same permissions as above
    const channel = await interaction.guild.channels.create({
      name: name.value,
      type: 15,
      // rateLimitPerUser: rate_limit?.value || 0,
      availableTags: [
        { name: "На розгляді", emoji: { name: "👀" }},
        { name: "Прийнято", emoji: { name: "✅" }},
        { name: "Відхилено", emoji: { name: "❌" }},
      ],
      defaultSortOrder: 1,
      defaultForumLayout: 1,
      defaultAutoArchiveDuration: 10080,
      reason: "Створення каналу для публікації пропозицій",
      permissionOverwrites:[
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['SendMessages'],
        },
        {
          id: this.user.id,
          allow: ['SendMessages'],
        },
      ]
    }).catch(e => this.emit('error', e))
    // saving tags ids
    let tags = {}
    for (const tag of channel.availableTags) {
      const lib = {
        'На розгляді': 'wait',
        'Прийнято': 'accept',
        'Відхилено': 'deny',
      }
      
      tags[
        lib[tag.name]
      ] = tag.id
    }
    // creating webhook
    const webhook = (await channel.createWebhook({
      name: this.user.username,
      avatar: await this.user.avatarURL(),
    }).catch(e => this.emit('error', e))).url
    // save the channel and alert settings to the database
    await this.db.set(`${this.collection}:${interaction.guildId}`,{
      channel: channel.id,
      alert: alert?.value || false,
      rate_limit: rate_limit?.value || 0,
      mention: mention?.value || 0,
      webhook, tags
    })
    // reply to the user with a success message and the settings that were applied
    interaction.reply({
      content: 
      `Налаштування завершено успішно\n\n- встановлено канал <#${
        channel.id
      }> для публікацій\n- сповіщення авторам публікацій ${
        alert?.value ? '**Увімкнуто**' : '**Вимкнуто**'
      }\n - кількість секунд, яку користувач повинен чекати ${
        rate_limit?.value ? `**${rate_limit?.value} cек.**` : "**не встановлено**"
      }\n - згадування ролі ${
        mention?.value ? `<@&${mention?.value}> (якщо ви бачите тільки цифки, в налаштуванні ролі дозволити згадування)` : "**не встановлено**"
      }`,
      ephemeral: true
    }).catch(e => this.emit('error', e))
    return    
  } else {
    // if neither name nor channel are provided, reply with an error message
    interaction.reply({ content: 'Не вказано ні один варіант \n`name`- назва нового каналу\n`channel` - існуючий форум\n\n**Для налаштування спробуйте знову** ', ephemeral: true }).catch(e => this.emit('error', e))
    return
  }
}

