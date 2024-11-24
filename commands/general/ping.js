const { SlashCommandBuilder, ActionRowBuilder, ActionRow, TextInputBuilder, TextInputStyle } = require('discord.js');
const { Events, ModalBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Request data access from server admins.'),
	async execute(interaction) {
        console.log('running');
        await interaction.reply("fuck");
	},
};
