const {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { Events, ModalBuilder } = require("discord.js");
const PlaylistsData = require("../../_archive/PLD_S.json");
const fs = require("node:fs");
const { MongoDocHandle } = require("../../mongodb-maploop");
const util = require("../../utility");

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
            .setName("id")
            .setDescription("ID of the playlist you want to view")
            .setRequired(false),
        ),
    ),
  async execute(interaction) {
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "save": {
        const modal_id = util.generateUUID();
        const modal = new ModalBuilder()
          .setCustomId(modal_id)
          .setTitle("Save Playlist");

        const nameInput = new TextInputBuilder()
          .setCustomId("name_input")
          .setLabel("Playlist Name")
          .setStyle(TextInputStyle.Short);

        const descInput = new TextInputBuilder()
          .setCustomId("desc_input")
          .setLabel("Description")
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
        const descRow = new ActionRowBuilder().addComponents(descInput);
        const colorRow = new ActionRowBuilder().addComponents(colorInput);
        const thumbnailRow = new ActionRowBuilder().addComponents(
          thumbnailInput,
        );
        const urlRow = new ActionRowBuilder().addComponents(urlInput);

        modal.addComponents(nameRow, descRow, colorRow, thumbnailRow, urlRow);
        await interaction.showModal(modal);
        await interaction
          .awaitModalSubmit({
            filter: (modalInteraction) =>
              modalInteraction.customId === modal_id,
            time: 300_000,
          })
          .then((modalInter) => {
            const name = modalInter.fields.getTextInputValue("name_input");
            const desc = modalInter.fields.getTextInputValue("desc_input");

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
              description: desc,
              thumbnail: thumbnail,
              timestamp: timestamp,
              author: interaction.user.id,
              url: url,
            };
            playlist.bulkSet(dataConstructed);
            const author = interaction.user;
            const embed = new EmbedBuilder()
              .setColor(color)
              .setTitle(name)
              .setURL(url)
              .setThumbnail(thumbnail)
              .addFields([
                { name: "Description", value: desc },
                { name: "URL", value: url },
              ])
              .setAuthor({
                name: "By " + author.username,
                iconURL: author.displayAvatarURL(),
              })
              .setTimestamp(timestamp);
            modalInter.reply({
              content: "**PLAYLIST SAVED.**",
              embeds: [embed],
            });
          })
          .catch((err) => {
            console.log(err);
            interaction.followUp("interaction timed out.");
          });
        break;
      }
      case "view": {
        const playlist_name = interaction.options.getString("id");
        if (!playlist_name) {
          await interaction.deferReply();
          const embed = new EmbedBuilder()
            .setColor("#32a852")
            .setTitle("Select a playlist to view!")
            .setTimestamp();

          const playlist_list = await new MongoDocHandle(
            "playlists",
            "placebo",
          ).grab_all();

          if (playlist_list.length <= 0) {
            const em2 = new EmbedBuilder()
              .setTitle("No playlists have been saved yet :(")
              .setTimestamp()
              .setColor("#ad2d31");
            await interaction.followUp({ embeds: [em2] });
            return;
          }

          const select_id = util.generateUUID();
          const select = new StringSelectMenuBuilder()
            .setCustomId("c_view_pl-" + select_id)
            .setPlaceholder("Select a playlist!");

          const opt = [];
          for (doc of playlist_list) {
            const at = interaction.client.users.cache.get(doc["author"]);
            opt.push(
              new StringSelectMenuOptionBuilder()
                .setLabel(doc["name"] + " (by " + at.username + ")")
                .setDescription(doc["description"])
                .setValue(doc["id"]),
            );
            console.log("putting in " + doc["name"]);
          }
          select.addOptions(opt);
          const row = new ActionRowBuilder().addComponents(select);

          await interaction.followUp({ embeds: [embed], components: [row] });
          return;
        }
        const playlist = new MongoDocHandle("playlists", playlist_name);
        if (!(await playlist.getDocument())) {
          const em2 = new EmbedBuilder()
            .setTitle(
              'No playlist with ID "' + playlist_name + '" was found :(',
            )
            .setDescription(
              "Use `/playlist view` with no arguments to view all the available playlists.",
            )
            .setTimestamp()
            .setColor("#ad2d31");
          await interaction.reply({ embeds: [em2] });
          return;
        }

        let data = await playlist.getDocument();
        const author = interaction.client.users.cache.get(data["author"]);
        const embed = new EmbedBuilder()
          .setColor(data["color"])
          .setTitle(data["name"])
          .setURL(data["url"])
          .setThumbnail(data["thumbnail"])
          .addFields([
            { name: "Description", value: data["description"] },
            { name: "URL", value: data["url"] },
          ])
          .setAuthor({
            name: "By " + author.username,
            iconURL: author.displayAvatarURL(),
          })
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
