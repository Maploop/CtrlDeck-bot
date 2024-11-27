const {
  Client,
  EmbedBuilder,
  Collection,
  Events,
  GatewayIntentBits,
} = require("discord.js");
const { token, clientId, guildId } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");
const CommandDeployer = require("./deploy-commands");
const { MongoDocHandle } = require("./mongodb-maploop");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.playlistsSaved = new Collection();
const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

if (process.argv[2] === "--refreshCmd")
  CommandDeployer.deploy_commands(token, clientId, guildId, commands);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (!interaction.customId.startsWith("c_view_pl-")) return;

  const selected_value = interaction.values[0];
  await interaction.deferReply();
  const playlist = new MongoDocHandle("playlists", selected_value);
  if (!(await playlist.getDocument())) {
    const em2 = new EmbedBuilder()
      .setTitle('No playlist with ID "' + playlist_name + '" was found :(')
      .setDescription(
        "Use `/playlist view` with no arguments to view all the available playlists.",
      )
      .setTimestamp()
      .setColor("#ad2d31");
    await interaction.followUp({ embeds: [em2] });
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

  await interaction.followUp({ embeds: [embed] });
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(token);
