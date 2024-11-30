const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { MongoDocHandle } = require("../../mongodb-maploop");
const oldStashData = require('../../_archive/STASH.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("migrate_my_data")
    .setDescription("Migrate your old stash data to MongoDB"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const userStashData = oldStashData[interaction.user.id];
    if (!userStashData) {
      const embed = new EmbedBuilder().setTimestamp().setTitle("<!> NO DATA FOUND (LEGACY FORMAT CHECKED: A)").setColor("Red");
      await interaction.followUp({ embeds: [embed] });
    }


    let dataDoc = {};
    let keyList = [];
    for (var key of Object.keys(userStashData)) {
      if (key.startsWith("_id") || key.startsWith("id"))
        continue;
      // HACK: ik it's not memory efficient pls leave me alone.
      // FIXME:
      oldKey = key;
      key = key.replaceAll(".", ",");
      dataDoc[key] = userStashData[oldKey];
      keyList.push(oldKey);
    }

    const dataHandler = new MongoDocHandle("stash", interaction.user.id);
    await dataHandler.bulkSet(dataDoc);

    const embed = new EmbedBuilder().setTimestamp().setTitle("<!> DONE.")
      .setDescription("```" + keyList.toString() + "```").setColor("DarkGreen");
    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },
};
