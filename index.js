const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);

/*----------------------------------^Discord Bot^---------------------------------------- */
/*--------------------------------^Google Docs API^---------------------------------------- */

const mandemQuotesID = '1HnleC6fnhQDRynVGHI1QRg6BKKtDwjjOpKcCDLAoKLQ';
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
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
    const todaysDate = day + '/' + month
    quotes = res.data.body.content.map(d=>d.paragraph?.elements[0].textRun.content);
    searchQuotes(quotes, todaysDate)
}

function checkTime() {
    const date = new Date()
    let hrs = date.getHours()
    let mins = date.getMinutes()
    let currTime = `${hrs}:${mins}`
    currTime = "00:00"
    console.log(currTime);
    //todaysDate = "2/1"; //Testing
    if (currTime === "00:00") {
        authorize().then(printDocTitle).catch(console.error);
    }
    else (console.log("Not midnight yet"));
}

checkTime()
//setInterval(checkTime, 60000)

function searchQuotes(everyQuote, date) {
    let dateRegexp = new RegExp(`\\b${date}\\b`)

    foundQuotes = []
    for(i = 0; i<everyQuote.length; i++)    
        if (everyQuote[i] != undefined && dateRegexp.test(everyQuote[i])) {
            foundQuotes.push(everyQuote[i]);
        }
    if (foundQuotes.length === 0) {
        console.log("No quotes said on " + date);
        client.channels.cache.get('1371488654677246013').send(`No quotes said on ${date}`)
    }
    else {
        sendQuotesToChannel(foundQuotes, todaysDate);
    }
} 

function sendQuotesToChannel(quotes, date) {
    var allQuotes = "";
    quotes.forEach((element) => {
        allQuotes += element + "\n",
        console.log(element)
    });
    client.channels.cache.get('1365698163096424593').send(`Quotes found on ${date}: \n ${allQuotes}`)
}

