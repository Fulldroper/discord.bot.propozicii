const axios = require("axios").default

module.exports = function (...x) {
  console.log(...x)
  process.env.LOG_WEBHOOK_URL && axios({
    method: 'post',
    url: process.env.LOG_WEBHOOK_URL,
    headers:{
      "Content-Type": "multipart/form-data"
    },
    data: { 
      content:`\`\`\`js\n${x?.stack || x.join("")}\`\`\``,
      username: this?.user?.username || process.env.npm_package_name,
      avatar_url: this?.user?.avatarURL() || ''
    }
  })
}