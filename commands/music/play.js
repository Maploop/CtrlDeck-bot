const {
  SlashCommandBuilder,
  SlashCommandStringOption,
} = require("@discordjs/builders");
const { MongoDocHandle } = require("../../mongodb-maploop");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play some music or something..")
    .addStringOption((opt) => {
      return opt
        .setName("query")
        .setDescription("Query search or URL")
        .setRequired(true);
    }),
  async execute(interaction) {
    const query = interaction.options.getString("query");
    await interaction.reply("You searched for " + query);
  },
};
