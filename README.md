The purpose of this project is to create a Discord bot that allows users to create and manage proposals on a Discord server.

### Project Benefits
This project helps in organizing and managing proposals within a Discord community, making it easier for users to submit, vote, and discuss proposals.

### How the Project Works
The project uses Node.js to create a Discord bot that listens for specific commands to create and manage proposals. Users can interact with the bot to submit new proposals and vote on existing ones.

### Repository and Installation
[GitHub Repository](https://github.com/Fulldroper/discord.bot.propozicii)

To install and use the project:

1. Clone the repository:
    ```bash
    git clone https://github.com/Fulldroper/discord.bot.propozicii
    cd discord.bot.propozicii
    ```

2. Install dependencies and start the bot:
    ```bash
    npm install
    npm start
    ```

### Project Workflow
1. **Setup Project:** Initialize the project structure and dependencies.
    ```bash
    npm init
    npm install
    ```

2. **Create Discord Bot:** Set up the bot to connect to Discord and listen for proposal commands.
    ```javascript
    // env configuration
    process.env.NODE_ENV || await require('dotenv').config({ debug: false })
    // req discord framework
    const { Client, GatewayIntentBits } = await require('discord.js');
    const importer = await require('fd-importer');
    // init discord bot && rest obj
    const bot = new Client({ intents: [
        GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildIntegrations
    ] });
    // set datebase collection name
    bot.collection = process.env.npm_package_name
    ```

3. **Implement Proposal Features:** Add functionalities for creating and managing proposals.
    ```javascript
    // add event listeners
    let temp = await importer('src/events/', {
        debug: process.env.DEBUG
    })
    for (const event in temp) {
        bot.on(event, temp[event])
    }
    // add custom methods
    temp = await importer('src/methods/', {
        debug: process.env.DEBUG
    })
    for (const method in temp) {
        bot[method] = temp[method]
    }
    // clear data
    delete temp
    // run bot
    bot.login(process.env.TOKEN)
    ```

### Skills Gained
- Developing Discord bots with Node.js
- Implementing proposal management features
- Managing and configuring bot settings for server interaction
