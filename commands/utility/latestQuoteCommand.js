const { SlashCommandBuilder, EmbedBuilder, quote } = require("discord.js");
const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const mandemQuotesID = '1HnleC6fnhQDRynVGHI1QRg6BKKtDwjjOpKcCDLAoKLQ';

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

module.exports = {
    data: new SlashCommandBuilder() 
        .setName('latestquote')
        .setDescription('Show the latest quote'),

    async execute(interaction) {
        await interaction.deferReply();
        const requestedName = interaction.options.getString('name');
    
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
            //quotes = res.data.body.content.map(d=>d.paragraph?.elements[0].textRun.content);
            let quotes = res.data.body.content
            .filter(d => d.paragraph?.paragraphStyle?.namedStyleType !== 'HEADING_2')
            .map(d => d.paragraph?.elements?.map(e => e.textRun?.content).join(''))
            .filter(Boolean)
            searchQuotes(quotes)
        }

    function searchQuotes(everyQuote) {
        let multQuote = [];
        let x = 1
        let lastQuote = everyQuote[everyQuote.length-x];
        while (lastQuote == null || lastQuote.trim() === '') {
          x++
          lastQuote = everyQuote[everyQuote.length-x]
        }   
        
        moveFrom = everyQuote.length-x;
        if (lastQuote != null || lastQuote.trim() !== '') {
            while(everyQuote[moveFrom] != null && everyQuote[moveFrom].trim() !== '') {
              multQuote.push(everyQuote[moveFrom]);
              moveFrom--;
            }
        }
        multQuote.reverse();
        sendQuotesToChannel(multQuote.join(''));
      } 

    async function sendQuotesToChannel(quote) {       
      //interaction.reply(`All quotes said by ${name}: \n ${quotes}`);
      await interaction.editReply(`Latest quote:\n${quote}`);
    }    
    const auth = await authorize();
    await printDocTitle(auth);
    }, 
};
