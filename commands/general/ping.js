const { SlashCommandBuilder } = require("discord.js");
const { MongoDocHandle } = require("../../mongodb-maploop");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Request data access from server admins."),
  async execute(interaction) {
    await interaction.deferReply();

    const someRandoDoc = new MongoDocHandle("stash", "testId");
    // someRandoDoc.insertIFNotExists();
    someRandoDoc.set("secondTestVariableTypeShi", "typeShiTypeShitFreeKingVon");

    await interaction.followUp("fuck");
  },
};
