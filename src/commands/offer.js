module.exports.info = {
  "name": "offer",
  "type": 1,
  "dm_permission": false,
  "description": "Створити пропозицію",
  "options": [{
    "name": "text",
    "description": "Текст пропозиції",
    "type": 3,
    "required": true
  },
  {
    "name": "image",
    "description": "Додадкове зображення до пропозиції",
    "type": 11,
    "channel_types": 0,
    "required": false
  }]
}

module.exports.run = async function (interaction) {
  const ref = await this.db.get(`${this.user.username}:${interaction.guildId}`)
    if (ref?.channel) {
      if (interaction.channelId === ref.channel) {  
        const user = interaction.member.user
        let {value} = interaction.options.get("text")
        const img = interaction.options.get("image")
        const embed = {
          "embeds": [
            {
              "type": "rich",
              "title": `Нова ініціатива від ${user.username}#${user.discriminator}`,
              "color": user.id == process.env.AUTHOR_ID ? 0x5a3cbb : 0x313e3e,
              "description": `${value}`,
              "thumbnail": {
                "url": `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
                "height": 0,
                "width": 0
              },
              "footer": {
                "text": `ініціатива має набрати ${ref?.threshold || 20} підписів для розгляду`,
                "iconURL": `${interaction.guild.iconURL() || "https://cdn.discordapp.com/attachments/539138991031844864/986493279833055262/planning1.png"}`
              }
            }
          ]
        }
        const threadOptions = {
          name: `Нова ініціатива від ${user.username}#${user.discriminator}`,
          autoArchiveDuration: 60
        }
        if(img?.attachment?.url) embed.embeds[0].image = {url : img.attachment.url };

          await interaction.reply(embed).catch(e => this.error(e))

          const message = await interaction.fetchReply();

          await message.startThread(threadOptions).catch(e => this.error(e));
          await message.react('✅').catch(e => this.error(e));
          await message.react('❌').catch(e => this.error(e));

      } else interaction.reply({ content: `❌ Цей канал не є каналом для пропозицій, спробуйте в каналі <#${ref.channel}>.`, ephemeral: true }).catch(e => this.error(e));
    } else interaction.reply({ content: '❌ Канал для пропозицій за замовчуванням не встановлено.', ephemeral: true }).catch(e => this.error(e));
}