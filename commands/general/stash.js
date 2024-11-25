const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ActionRow,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandSubcommandBuilder,
} = require("discord.js");
const { Events, ModalBuilder } = require("discord.js");
const stashData = require("./../../_archive/STASH.json");
const fs = require("node:fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stash")
    .setDescription("If you don't know what this is don't use it.")
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("view")
        .setDescription("View the current stash"),
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
        .setName("insert")
        .setDescription("Insert a new link to the stash")
        .addBooleanOption((opt) =>
          opt
            .setName("update_cache")
            .setRequired(false)
            .setDescription("Update all online data or no"),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case "view": {
        authorId = interaction.user.id;
        if (!stashData[authorId]) {
          embed = new EmbedBuilder()
            .setColor("Red")
            .setTimestamp()
            .setTitle("No data found for you");
          await interaction.reply({ embeds: embed });
          return;
        }
        updateCacheNeccessary =
          !stashData[authorId]["CACHE"] ||
          interaction.options.getBoolean("update_cache");

        entryCount = Object.keys(stashData[authorId]).length;
        embed = new EmbedBuilder()
          .setColor("Aqua")
          .setTitle('Stash data for "' + authorId + '"')
          .setDescription(
            "Found `" +
              entryCount +
              "` entr" +
              (entryCount > 1 ? "ies" : "y") +
              ".",
          );

        await interaction.deferReply({ ephemeral: true });

        const fieldList = [];
        for (key of Object.keys(stashData[authorId])) {
          keyForTitle = key;
          if (key.endsWith("/")) keyForTitle = key.slice(0, -1);

          keySplit = keyForTitle.split("/");
          title = keySplit[keySplit.length - 1];

          desc = "";
          for (altKey of Object.keys(stashData[authorId][key])) {
            if (altKey.startsWith("INTERNAL__")) continue;

            desc +=
              "• " + altKey + ": " + stashData[authorId][key][altKey] + "\n";
          }
          desc += `-> **[[VIEW]](${key})**`;

          fieldList.push({ name: title, value: desc, inline: true });
        }

        embed.addFields(fieldList);

        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
        break;
      }
      case "insert": {
        const modal = new ModalBuilder()
          .setCustomId("m_insert_stash")
          .setTitle("Insert to stash");

        const linkInput = new TextInputBuilder()
          .setCustomId("link_input")
          .setLabel("URL")
          .setStyle(TextInputStyle.Short);

        const dataInput = new TextInputBuilder()
          .setCustomId("data_input")
          .setLabel("MLDF Data")
          .setStyle(TextInputStyle.Paragraph);

        const linkRow = new ActionRowBuilder().addComponents(linkInput);
        const dataRow = new ActionRowBuilder().addComponents(dataInput);

        modal.addComponents(linkRow, dataRow);
        await interaction.showModal(modal);
        await interaction
          .awaitModalSubmit({
            filter: (modalInteraction) =>
              modalInteraction.customId === "m_insert_stash",
            time: 60_000,
          })
          .then((modalInter) => {
            const link = modalInter.fields.getTextInputValue("link_input");
            const data = modalInter.fields.getTextInputValue("data_input");

            authorId = interaction.user.id;

            if (!stashData[authorId]) {
              stashData[authorId] = {};
            }

            stashData[authorId][link] = JSON.parse(data);
            stashData[authorId][link]["INTERNAL__url"] = link;

            const jsonDataConverted = JSON.stringify(stashData, null, 2);

            fs.writeFileSync(
              "./_archive/STASH.json",
              jsonDataConverted,
              (err) => {
                if (err) {
                  console.log(err);
                }
              },
            );

            emebed = new EmbedBuilder()
              .setColor("DarkGreen")
              .setTitle("ACTION COMPLETE.")
              .setTimestamp();

            modalInter.reply({
              embeds: [emebed],
            });
          })
          .catch((err) => {
            console.log(err);
            interaction.reply("Error occurred.");
          });

        break;
      }
    }
  },
};
