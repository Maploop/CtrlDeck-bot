const { REST, Routes, EmbedBuilder } = require('discord.js');
const { Client, Collection, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, GatewayIntentBits } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent] });

client.commands = new Collection();
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
	await interaction.deferReply();

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
	if (interaction.customId === "request_data_access_form")
	{
		// Get the data entered by the user
		
		const favoriteColor = interaction.fields.getTextInputValue('nameInput');
		const hobbies = interaction.fields.getTextInputValue('intentionsInput');

		const confirm = new ButtonBuilder()
			.setCustomId('btn_confirm_' + interaction.user.id)
			.setLabel('Grant Access')
			.setStyle(ButtonStyle.Success);

		const cancel = new ButtonBuilder()
			.setCustomId('btn_cancel_' + interaction.user.id)
			.setLabel('Deny Access & Notify')
			.setStyle(ButtonStyle.Secondary);

		const cancel2 = new ButtonBuilder()
			.setCustomId('btn_cancel2')
			.setLabel(`Deny Access & Don't Notify`)
			.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder()
			.addComponents(confirm, cancel, cancel2);

		const embed = new EmbedBuilder()
		.setTitle("Data Access Request").setAuthor({name: `${interaction.user.displayName} (@${interaction.user.username})`, iconURL: interaction.user.avatarURL()}).addFields({name: "Name", value: favoriteColor}, {name: "Intentions", value: hobbies});
		client.channels.cache.get('1274018742375813190').send({embeds: [embed], components: [row]});

		await interaction.reply("Request sent successfully.");
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;
	console.log(interaction.customId);
	if (interaction.customId.startsWith("btn_"))
	{
		console.log('running here too')
		var actualID = interaction.customId.replace("btn_", "");
		if (actualID.startsWith("confirm_"))
		{
			var userId = actualID.replace("confirm_", "");
			var role= client.guilds.cache.get(guildId).roles.cache.get('1274025102459011146');
			var user = client.guilds.cache.get(guildId).members.cache.get(userId);
			user.roles.add(role);
			user.send("You have been granted data access in CtrlDeck™.");

			await interaction.reply("Done. [0x0000_1 NOTIFY_ON]");
		}

		if (actualID.startsWith("cancel_"))
		{
			var userId = actualID.replace("cancel_", "");
			var user = client.guilds.cache.get(guildId).members.cache.get(userId);
			user.send("You have been denied data access in CtrlDeck™.");
			await interaction.reply("Done. [0x0000_0 NOTIFY_ON]");
		}

		if (actualID.startsWith("cancel2"))
		{
			await interaction.reply("Done. [0x0000_0 NOTIFY_OFF]");
		}
	}
});

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(token);
