const {EmbedBuilder} = require("discord.js")
module.exports.info = {
  "name": "Схвалити",
  "dm_permission": false,
  "type": 3,
}
module.exports.run = async function (interaction) {
  const ref = await this.db.get(`${this.user.username}:${interaction.guildId}`)
  if (interaction.member.permissions.serialize().Administrator) {
    if (ref) {
      if (interaction.channelId === ref.channel) {
        const {targetId,channelId} = interaction
        const ch = this.channels.cache.get(channelId)
        const msg = await ch.messages.fetch(targetId)
        
        if (
          msg.author.id !== this.user.id ||
          !msg?.embeds[0]?.title ||
          !(/^Нова.*/.test(msg.embeds[0].title))
          ) {
          interaction.reply({ content: `❌ Повідомлення не є пропозицією.`, ephemeral: true }).catch(e => this.error(e));
          return
        }

        try {
          ref?.threadClean && await msg.thread.delete().catch(()=>0)
          msg.delete().catch(()=>0)
        } catch (error) {
          
        }

        const embed = new EmbedBuilder()
        .setColor(0x139f00)
        .setDescription(msg.embeds[0].description)
        .setTitle(msg.embeds[0].title.replace("Нова", "Схвалена"))
        .setFooter(
          {
            text: `ініціатива набрала ${msg.reactions.cache.get("✅").count--} ✅ та ${msg.reactions.cache.get("❌").count--} ❌`,
            iconURL: `${interaction.guild.iconURL() || "https://cdn.discordapp.com/attachments/539138991031844864/986493279833055262/planning1.png"}`
          }         
          
        )
        const usr = this.users.cache.find(user => (user.tag === msg.embeds[0].title.replace("Нова ініціатива від ","")))
        const url = usr?.avatarURL()
        url && (embed.setThumbnail(url))
        msg.embeds[0]?.image?.url && embed.setImage(msg.embeds[0]?.image?.url)

        try {
          const newch = await ch.send({embeds:[embed]})
          await newch.startThread({
            name: `Коментарі`,
            autoArchiveDuration: 60
          })
        } catch (error) {
          
        }

        if (ref?.alerts) {
          try {
            usr.send({embeds:[embed]})
          } catch (error) {
            
          }
        }
        interaction.reply({ content: `✅ Пропозицію схвалено.`, ephemeral: true }).catch(e => this.error(e));
        // await (3000).sleep()
        // interaction.deleteReply()
      } else interaction.reply({ content: `❌ Цей канал не є каналом для пропозицій, спробуйте в каналі <#${ref}>.`, ephemeral: true }).catch(e => this.error(e));
    } else interaction.reply({ content: '❌ Канал для пропозицій за замовчуванням не встановлено.', ephemeral: true }).catch(e => this.error(e));
  } else interaction.reply({ content: '❌ Ви маєте мати права адміністратора', ephemeral: true }).catch(e => this.error(e));
}