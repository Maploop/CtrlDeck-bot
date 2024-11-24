const { REST, Routes } = require("discord.js");

module.exports = {
    deploy_commands: function (token, clientId, guildId, commands) {
        const rest = new REST().setToken(token);
        (async () => {
        try {
            console.log(
            `Started refreshing ${commands.length} application (/) commands.`,
            );
    
            const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
            );
    
            console.log(
            `Successfully reloaded ${data.length} application (/) commands.`,
            );
        } catch (error) {
            console.error(error);
        }
        })();
    }
};