const { SlashCommandBuilder, ActionRowBuilder, ActionRow, TextInputBuilder, TextInputStyle } = require('discord.js');
const { Events, ModalBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('request_access')
		.setDescription('Request data access from server admins.'),
	async execute(interaction) {
        console.log('running');
        const modal = new ModalBuilder()
            .setCustomId("request_data_access_form")
            .setTitle("Data Access Request");

        const favoriteColorInput = new TextInputBuilder()
            .setCustomId('nameInput')
            // The label is the prompt the user sees for this input
            .setLabel("Your name/nickname")
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short);

        const hobbiesInput = new TextInputBuilder()
			.setCustomId('intentionsInput')
			.setLabel("Intentions for accessing the data in CtrlDeck")
		    // Paragraph means multiple lines of text.
			.setStyle(TextInputStyle.Paragraph);

        const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
        const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);
		modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
	},
};