const {
  SlashCommandBuilder,
  SlashCommandStringOption,
} = require("@discordjs/builders");
const { MongoDocHandle } = require("../../mongodb-maploop");
const ytdl = require("ytdl-core-discord");
const { joinVoiceChannel } = require("discord.js");
const { token, clientId, guildId } = require("../../config.json");

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
    if (!interaction.member.voice.channel) {
      await interaction.reply("<!> NOT IN A VC.");
      return;
    }
    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: guildId,
      adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
    });
    const query = interaction.options.getString("query");
    await interaction.reply("You searched for " + query);
  },
};
