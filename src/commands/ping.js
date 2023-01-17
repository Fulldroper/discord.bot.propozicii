module.exports.info = {
  "name": "ping",
  "dm_permission": false,
  "type": 1,
  "description": "pong"
}

module.exports.run = async function(interaction) {
  interaction.reply("pong")
}