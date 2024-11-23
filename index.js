const { REST, Routes, EmbedBuilder } = require('discord.js');
const { Client, Collection, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, GatewayIntentBits } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const PlayListData = require("./_archive/PLD_S.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent] });

client.commands = new Collection();
client.playlistsSaved = new Collection();
const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);



for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	// await interaction.deferReply();

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isModalSubmit()) return;
	if (interaction.isModalSubmit()) {
		// Access customId directly
		if (interaction.customId === 'm_save_playlist') {
		  const name = interaction.fields.getTextInputValue('name_input');
		  const color = interaction.fields.getTextInputValue('color_input');
		  const thumbnail = interaction.fields.getTextInputValue('thumbnail_input');
		  const url = interaction.fields.getTextInputValue('spotify_url');
		  const timestamp = Date.now();
		  
		  let nameFixed = name.replaceAll(" ", "_").replaceAll("'", "").toLowerCase();

		  PlayListData[nameFixed] = {};
		  PlayListData[nameFixed]['name'] = name;
		  PlayListData[nameFixed]['color'] = color;
		  PlayListData[nameFixed]['thumbnail'] = thumbnail;
		  PlayListData[nameFixed]['timestamp'] = timestamp;
		  PlayListData[nameFixed]['url'] = url;

		  const jsonDataConverted = JSON.stringify(PlayListData, null, 2);

		  fs.writeFileSync('./_archive/PLD_S.json', jsonDataConverted, (err) => {
			if (err) {
				console.log(err);
			}
		  })

		  const embed = new EmbedBuilder()
		  	.setColor(color)
			.setTitle(name)
			.setURL(url)
			.setThumbnail(thumbnail)
			.setDescription("View Playlist: " + url)
			.setTimestamp(timestamp);
		  interaction.channel.send({content: "**PLAYLIST SAVED.**", embeds: [embed]});
		  // await interaction.reply({content: "Done!", ephemeral: true});
		}
	  }
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;
	console.log(interaction.customId);
});

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(token);
