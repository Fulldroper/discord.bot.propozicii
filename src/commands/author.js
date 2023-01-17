const {EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js")
module.exports.info = {
  "name": "author",
  "type": 1,
  "dm_permission": true,
  "description": "Написати автору бота",
  "options": [{
    "name": "text",
    "description": "Текст",
    "type": 3,
    "required": true
  },
  {
    "name": "image",
    "description": "Додадкове зображення до тексту",
    "type": 11,
    "channel_types": 0,
    "required": false
  }]
}


module.exports.run = async function (interaction) {
  const user = interaction.member.user
  let {value} = interaction.options.get("text")
  const img = interaction.options.get("image")
  const author = await this.users.fetch(process.env.AUTHOR_ID)
  const {username, id, avatar, discriminator} = interaction.member.user
  if (author) {
    const embed = new EmbedBuilder()
    .setColor(0x139f00)
    .setDescription(value)
    .setTitle(`Повідомлення від ${username}#${discriminator}`)
    .setFooter(
      {
      text: interaction.guild.name,
      iconURL: `${interaction.guild.iconURL() || "https://cdn.discordapp.com/attachments/539138991031844864/986493279833055262/planning1.png"}`
      }
    )
    const url = interaction.member.user?.avatarURL()
    url && (embed.setThumbnail(url))
    img?.attachment?.url && embed.setImage(img?.attachment?.url)

    const components = [
      {
          "type": 1,
          "components": [
              {
                  "type": 2,
                  "label": "Відповісти",
                  "style": 3,
                  "custom_id": `${interaction.commandName}:${user.id}`,
                  "emoji": "📧"
              }
          ]
      }
  ]
      
    author.send({embeds:[embed], components})
    interaction.reply({content: 'Ваше повідомлення відправленно, очікуйте відповіді', ephemeral: true })
  } else {
    interaction.reply({content: 'Немає можливості відправити ваше повідомлення, спробуйте пізніше', ephemeral: true })
  }

}

module.exports.component = async function(interaction) {

  const modal = new ModalBuilder()
  .setCustomId(interaction.customId)
  .setTitle('Відповідь на запит');
  
  const favoriteColorInput = new TextInputBuilder()
  .setCustomId('text')
  // The label is the prompt the user sees for this input
  .setLabel("Текст відповіді")
  .setMaxLength(65)
  // Short means only a single line of text
  .setStyle(TextInputStyle.Paragraph)
  .setRequired(false);
  
  const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
  
  modal.addComponents(firstActionRow);
  
  await interaction.showModal(modal);
}

 
module.exports.modal = async function (interaction) {

  const user = await this.users.fetch(interaction.meta[1])
  const text = interaction.fields.getTextInputValue("text") || null

  const embed = new EmbedBuilder()
  .setColor(0x5a3cbb)
  .setDescription(text)
  .setTitle(`Відповідь адміністратора`)
  .setFooter({
    text: `сайт бота https://propozicii.ml/`,
    iconURL: `https://propozicii.ml/assets/media/logo.png`
  })
 
  try {
    user.send({embeds: [embed]})
  } catch (error) {
    this.log(error);
  }
  
  interaction.reply({ content: `${user} отримав відповідь`, embeds: [embed], ephemeral: true }).catch(e => this.error(e));
}