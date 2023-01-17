const {EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js")
module.exports.info = {
  "name": "Відхилити",
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
          
          
          
          const modal = new ModalBuilder()
          .setCustomId(`${interaction.commandName}:${channelId}:${targetId}:${ref?.alerts}:${ref?.threadClean}`)
          .setTitle('Відхилення пропозиції');
          
          const favoriteColorInput = new TextInputBuilder()
          .setCustomId('reason')
          // The label is the prompt the user sees for this input
          .setLabel("Причина відхилення (не обов'язково)")
          .setMaxLength(65)
          // Short means only a single line of text
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);
          
          const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
          
          modal.addComponents(firstActionRow);
          
          const reason = await interaction.showModal(modal);
          
        } else interaction.reply({ content: `❌ Цей канал не є каналом для пропозицій, спробуйте в каналі <#${ref}>.`, ephemeral: true }).catch(e => this.error(e));
      } else interaction.reply({ content: '❌ Канал для пропозицій за замовчуванням не встановлено.', ephemeral: true }).catch(e => this.error(e));
    } else interaction.reply({ content: '❌ Ви маєте мати права адміністратора', ephemeral: true }).catch(e => this.error(e));
  }
  
module.exports.modal = async function (interaction) {

  const ch = this.channels.cache.get(interaction.meta[1])
  const msg = await ch.messages.fetch(interaction.meta[2])
  const reason = interaction.fields.getTextInputValue("reason") || null

  try {
    interaction.meta[4] == true && await msg.thread.delete().catch(()=>0)
    msg.delete().catch(()=>0)
  } catch (error) {
    
  }

  const embed = new EmbedBuilder()
  .setColor(0x9f000e)
  .setDescription(msg.embeds[0].description)
  .setTitle(msg.embeds[0].title.replace("Нова", "Відхилена"))
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
    
  const embeds = [embed]

  if (reason) {
    const embed2 = new EmbedBuilder()
    .setColor(0x313e3e)
    // .setDescription(reason)
    .setTitle(`Адміністратор сервера ${interaction.user.username}#${interaction.user.discriminator}`)
    .setFooter({
      text: `Відповідь - "${reason}"`,
      iconURL: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`
    })
    embeds.push(embed2)
  }

  try {
    const newch = await ch.send({embeds})
    await newch.startThread({
      name: `Коментарі`,
      autoArchiveDuration: 60
    })
  } catch (error) {
    
  }
  if (interaction.meta[3]) {
    try {
      usr.send({embeds})
    } catch (error) {
      
    }
  }
  interaction.reply({ content: `❌ Пропозицію відхиленно.`, ephemeral: true }).catch(e => this.error(e));
  await (3000).sleep()
  try {
    interaction.deleteReply()
  } catch (error) {
    
  }
}