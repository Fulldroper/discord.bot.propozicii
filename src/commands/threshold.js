module.exports.info = {
  "name": "threshold",
  "type": 1,
  "dm_permission": false,
  "description": "Вказати порогове значення петиції (кількість підписів для розгляду)",
  "options": [{
    "name": "number",
    "description": "кількість підписів для розгляду",
    "type": 4,
    "channel_types": 0,
    "required": true
  }]
}

module.exports.run = async function(interaction) {
  if (interaction.member.permissions.serialize().Administrator) {
    const threshold = interaction.options.get("number").value
      this.db.set(`${this.user.username}:${interaction.guildId}`, {threshold})
      interaction.reply({ content: `Порогове значення, встановлено як **${threshold}** підписів.`, ephemeral: true }).catch(e => this.error(e));
  } else interaction.reply({ content: '❌ Ви маєте мати права адміністратора', ephemeral: true }).catch(e => this.error(e));
}