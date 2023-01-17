module.exports.info = {
    "name": "alerts",
    "dm_permission": false,
    "type": 1,
    "description": "Вказати чи будуть автори отримувати сповіщення щодо розгляду їх пропозицій",
    "options": [{
      "name": "bool",
      "description": "Вказати чи будуть автори пропозицій отримувати сповіщення? (Так або Ні)",
      "type": 5,
      "channel_types": 0,
      "required": true
    }]
  }
  
  module.exports.run = async function(interaction) {
    if (interaction.member.permissions.serialize().Administrator) {
      const alerts = interaction.options.get("bool").value
        this.db.set(`${this.user.username}:${interaction.guildId}`, {alerts})
        interaction.reply({ content: (alerts ? "✅ Сповіщення будуть надходити" : "❌ Сповіщення не будуть надходити" ), ephemeral: true }).catch(e => this.error(e));
    } else interaction.reply({ content: '❌ Ви маєте мати права адміністратора', ephemeral: true }).catch(e => this.error(e));
  }