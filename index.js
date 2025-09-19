const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
discordClient.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
discordClient.login(token);

const fingerSimmonsID = '1371488654677246013'
const testingChannelID = '1365698163096424593'
const mandemQuotesID = '1HnleC6fnhQDRynVGHI1QRg6BKKtDwjjOpKcCDLAoKLQ';
const dc_fs = require('node:fs');
const dc_path = require('node:path');
//const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
//const { token } = require('./config.json');

//const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
discordClient.commands = new Collection();

const foldersPath = dc_path.join(__dirname, 'commands');
const commandFolders = dc_fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = dc_path.join(foldersPath, folder);
	const commandFiles = dc_fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = dc_path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			discordClient.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

/*
client.on(Events.InteractionCreate, interaction => {
	console.log(interaction);
});
*/
discordClient.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) {
    return
  };
	const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command called ${interaction.commandName} was found.`);
    return;
  }

  try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!'});
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!'});
		}
	}
});


/*----------------------------------^Discord Bot^---------------------------------------- */
/*--------------------------------vGoogle Docs APIv-------------------------------------- */
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
async function printDocTitle(auth) {
  const docs = google.docs({version: 'v1', auth});
  const res = await docs.documents.get({
    documentId: mandemQuotesID,
  });
    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth() + 1
    //todaysDate = "2/1"; //Testing
    const todaysDate = day + '/' + month
    quotes = res.data.body.content.map(d=>d.paragraph?.elements[0].textRun.content);
    searchQuotes(quotes, todaysDate)
}

function checkTime() {
    const date = new Date()
    let hrs = date.getHours()
    let mins = date.getMinutes()
    let currTime = `${hrs}:${mins}`
    //currTime = "00:00"
    console.log(currTime);
    
    if (currTime === "00:00") {
        authorize().then(printDocTitle).catch(console.error);
    }
    else (console.log("Not midnight yet"));
}

//checkTime()
setInterval(checkTime, 60000)

 /*
ATM EVERY COMMAND DOES WORK BUT THERE ARE A FEW ISSUES
---
CURRENT ISSUES WITH THIS:
/namesearch will find non-exact matches (e.g searching for D will show quotes from Dan and Declan)

IDEAS:
- Allow people to search a range of dates (probably won't add this as people won't use it)
- Automatically add headings for current month if not already there (with correct styling)
*/

function searchQuotes(everyQuote, date) {
    let dateRegexp = new RegExp(`\\b${date}\\b`)

    foundQuotes = []
    everyQuote.forEach(quote => {   
        if (quote != undefined && dateRegexp.test(quote)) {
            foundQuotes.push(quote);
        }
      });
  
    if (foundQuotes.length === 0) {
        console.log("No quotes said on " + date);
        discordClient.channels.cache.get(testingChannelID).send(`No quotes said on ${date}`)
        discordClient.channels.cache.get(fingerSimmonsID).send(`No quotes said on ${date}`)
    }
    else {
        sendQuotesToChannel(foundQuotes, date);
    }
} 

async function sendQuotesToChannel(quotes, date) {
    var allQuotes = "";
    quotes.forEach((element) => {
        allQuotes += element + "\n",
        console.log(element)
    });
    await discordClient.channels.cache.get(testingChannelID).send(`Quotes found on ${date}: \n ${allQuotes}`)
    await discordClient.channels.cache.get(fingerSimmonsID).send(`Quotes said on ${date}: \n ${allQuotes}`)
}

 