const { EmbedBuilder } = require("discord.js")

module.exports.info = {
  "name": "info",
  "dm_permission": false,
  "type": 1,
  "description": "Інформація про бота"
}

module.exports.run = async function(interaction) {
  const c = "author"
  const embed = new EmbedBuilder()
  .setColor(0x5a3cbb)
  // і **${this.guilds.cache.size}** серверів
  .setThumbnail(this.user.avatarURL())
  .setTitle(`Інформація про бота`)
  .setURL(`https://${process.env.npm_package_config_domain}/`)
  .setDescription(`${this.description}
  \n✨ [Автор Бота fd#6297](https://fulldroper.cf/) написати автору </${c}:${this.commands[c].id}>
  \n👥 Наразі обслуговується **${this.users_counter}** користувачів
  \n🌐 Сайт бота [propozicii.ml](https://${process.env.npm_package_config_domain}/)
  \n🚀 [Запросити бота на свій сервер](https://discord.com/api/oauth2/authorize?client_id=${this.user.id}&permissions=8&scope=applications.commands%20bot)
  \n🎉 [Підтримка розробника](${process.env.npm_package_config_donate})
  \n** **`)
  .setFooter({
    text: `"Дякую за підтримку украіномовної розробки" - Автор`,
  })

  interaction.reply({
    "embeds": [embed], 
    "ephemeral": true
  }).catch(e => this.error(e))
}