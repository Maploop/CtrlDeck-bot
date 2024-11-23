const {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  ActionRowBuilder,
  ActionRow,
  TextInputBuilder,
  TextInputStyle, Collection
} = require("discord.js");
const { Events, ModalBuilder } = require("discord.js");
const PlaylistsData = require("../../_archive/PLD_S.json");

let savedPlaylists = []

for (key of Object.keys(PlaylistsData)) {
  let n = PlaylistsData[key]['name'];
	savedPlaylists.push({name: n, value: key})
}

console.log("Playlist added: " + savedPlaylists);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Find or view a playlist")
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("save")
        .setDescription("Save a new playlist"),
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("view")
        .setDescription("View a previously saved playlist")
        .addStringOption((opt) =>
          opt
            .setName("playlist_name")
            .setDescription("Name of the playlist you want to view")
            .setRequired(true).addChoices(savedPlaylists),
        ),
    ),
  async execute(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "save": {
        const modal = new ModalBuilder()
          .setCustomId("m_save_playlist")
          .setTitle("Save Playlist");

        const nameInput = new TextInputBuilder()
          .setCustomId("name_input")
          .setLabel("Playlist Name")
          .setStyle(TextInputStyle.Short);

        const colorInput = new TextInputBuilder()
          .setCustomId("color_input")
          .setLabel("Playlist Color")
          .setStyle(TextInputStyle.Short);

        const thumbnailInput = new TextInputBuilder()
          .setCustomId("thumbnail_input")
          .setLabel("Thumbnail (URL)")
          .setStyle(TextInputStyle.Short);

        const urlInput = new TextInputBuilder()
          .setCustomId("spotify_url")
          .setLabel("Playlist Link (Spotify)")
          .setStyle(TextInputStyle.Short);
        
          const nameRow = new ActionRowBuilder().addComponents(nameInput);
          const colorRow = new ActionRowBuilder().addComponents(colorInput);
          const thumbnailRow = new ActionRowBuilder().addComponents(thumbnailInput);
          const urlRow = new ActionRowBuilder().addComponents(urlInput);
        
          modal.addComponents(nameRow, colorRow, thumbnailRow, urlRow);
        await interaction.showModal(modal);
        await interaction.deferReply();
        break;
      }
    }

    // await interaction.followUp("ACTION FINISHED. (E-0)");
  },
};
