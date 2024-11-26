const {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const { Events, ModalBuilder } = require("discord.js");
const PlaylistsData = require("../../_archive/PLD_S.json");
const fs = require("node:fs");
const { MongoDocHandle } = require("../../mongodb-maploop");

let savedPlaylists = [];

for (key of Object.keys(PlaylistsData)) {
  let n = PlaylistsData[key]["name"];
  savedPlaylists.push({ name: n, value: key });
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
            .setRequired(true)
            .addChoices(savedPlaylists),
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
        const thumbnailRow = new ActionRowBuilder().addComponents(
          thumbnailInput,
        );
        const urlRow = new ActionRowBuilder().addComponents(urlInput);

        modal.addComponents(nameRow, colorRow, thumbnailRow, urlRow);
        await interaction.showModal(modal);
        await interaction
          .awaitModalSubmit({
            filter: (modalInteraction) =>
              modalInteraction.customId === "m_save_playlist",
            time: 60_000,
          })
          .then((modalInter) => {
            const name = modalInter.fields.getTextInputValue("name_input");
            const color = modalInter.fields.getTextInputValue("color_input");
            const thumbnail =
              modalInter.fields.getTextInputValue("thumbnail_input");
            const url = modalInter.fields.getTextInputValue("spotify_url");
            const timestamp = Date.now();

            let nameFixed = name
              .replaceAll(" ", "_")
              .replaceAll("'", "")
              .toLowerCase();

            const playlist = new MongoDocHandle("playlists", nameFixed);
            const dataConstructed = {
              name: name,
              color: color,
              thumbnail: thumbnail,
              timestamp: timestamp,
              url: url,
            };
            playlist.bulkSet(dataConstructed);

            const embed = new EmbedBuilder()
              .setColor(color)
              .setTitle(name)
              .setURL(url)
              .setThumbnail(thumbnail)
              .setDescription("View Playlist: " + url)
              .setTimestamp(timestamp);
            modalInter.reply({
              content: "**PLAYLIST SAVED.**",
              embeds: [embed],
            });
          })
          .catch((err) => {
            console.log(err);
            interaction.reply("Error occurred.");
          });
        break;
      }
      case "view": {
        const playlist_name = interaction.options.getString("playlist_name");
        const playlist = new MongoDocHandle("playlists", playlist_name);
        let data = playlist.getDocument();
        const embed = new EmbedBuilder()
          .setColor(data["color"])
          .setTitle(data["name"])
          .setURL(data["url"])
          .setThumbnail(data["thumbnail"])
          .setDescription("View Playlist: " + data["url"])
          .setTimestamp(data["timestamp"]);

        await interaction.reply("Loading...");
        await interaction.editReply({ content: "DONE", embeds: [embed] });
        break;
      }
      default: {
        await interaction.reply("Invalid SUBCMD.");
        break;
      }
    }

    // await interaction.followUp("ACTION FINISHED. (E-0)");
  },
};
