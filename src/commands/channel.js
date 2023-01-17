module.exports.info = {
  "name": "channel",
  "dm_permission": false,
  "type": 1,
  "description": "Вибрати канал для публікації пропозицій",
  "options": [{
    "name": "channel",
    "description": "Текстовий канал",
    "type": 7,
    "required": true
  }]
}

module.exports.run = async function(interaction) {
  if (interaction.member.permissions.serialize().Administrator) {
    const ref = interaction.options.get("channel")
    // if ([0, 2, 11, 12, 10, 5].includes(ref.type)) {
      this.db.set(`${this.user.username}:${interaction.guildId}`, {channel: ref.value})
      interaction.reply({ content: `✅ <#${ref.value}>, встановлено як канал для пропозицій.`, ephemeral: true }).catch(e => this.error(e));
    // } else interaction.reply({ content: '❌ Невірний тип каналу', ephemeral: true }).catch(e => this.error(e));
  } else interaction.reply({ content: '❌ Ви маєте мати права адміністратора', ephemeral: true }).catch(e => this.error(e));
}