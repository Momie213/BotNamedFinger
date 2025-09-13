const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const mandemQuotesID = '1HnleC6fnhQDRynVGHI1QRg6BKKtDwjjOpKcCDLAoKLQ';

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

module.exports = {
    data: new SlashCommandBuilder() 
        .setName('insertquote')
        .setDescription('Add a quote into the quote book')
        .addStringOption(option =>
		option.setName('quote')
			.setDescription('The quote that was said')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
            .setDescription('Name of the person that said the quote')
            .setRequired(true)),

    async execute(interaction) {
        const requestedName = interaction.options.getString('name');
        const quote = interaction.options.getString('quote');
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

        async function insertQuote(auth) {
          const docs = google.docs({version: 'v1', auth});
          const res = await docs.documents.get({
            documentId: mandemQuotesID,
          });
            const date = new Date()
            const day = date.getDate()
            const month = date.getMonth() + 1
            const year = date.getFullYear()
            const todaysDate = day + '/' + month + '/' + year;
            quoteBookEnd= res.data.body.content[res.data.body.content.length - 1].endIndex;

          await docs.documents.batchUpdate({
            documentId: mandemQuotesID,
            requestBody: {
              requests: [
                {
                  insertText: {
                    location: {index: quoteBookEnd - 1},
                    text: `\n"${quote}" - ${requestedName} (${todaysDate})`
                  }
                }
              
            ]}
          })

          }
          const auth = await authorize();
          await insertQuote(auth);
          await interaction.reply({content: `Quote: ${quote} successfully added!`})
  }
}
    