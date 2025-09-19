const { SlashCommandBuilder, EmbedBuilder, quote } = require("discord.js");
const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const mandemQuotesID = '1HnleC6fnhQDRynVGHI1QRg6BKKtDwjjOpKcCDLAoKLQ';

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

module.exports = {
    data: new SlashCommandBuilder() 
        .setName('namesearch')
        .setDescription('Search for any quotes by the specified person')
        .addStringOption(option =>
		option.setName('name')
			.setDescription('The name to be searched')
            .setRequired(true)),

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
            quotes = res.data.body.content
            .filter(d => d.paragraph?.paragraphStyle?.namedStyleType !== 'HEADING_2')
            .map(d => d.paragraph?.elements?.map(e => e.textRun?.content).join(''))
            .filter(Boolean);
            searchQuotes(quotes, requestedName)
        }

    function searchQuotes(everyQuote, name) {
        let foundQuotes = [];
        let quoteCounter = 0;
        everyQuote.forEach((quote, i) => { 
            multilineQuote = [];
            if (quote != undefined && (quote.includes(`- ${name}`) || quote.includes(`and ${name}`)) && everyQuote[i-1].length > 0) {
              quoteCounter++;
              let j = i;
              console.log(quote)
              while (j>0 && everyQuote[j] && everyQuote[j].trim().length > 0) {
                multilineQuote.push(everyQuote[j]);
                j--;
              }
              foundQuotes.push(multilineQuote.reverse().join('') + "\n");
            }
            else if (quote != undefined && (quote.includes(`- ${name}`) || quote.includes(`and ${name}`))) {
              quoteCounter++;
              foundQuotes.push(quote + "\n" + "\n");
            }
          });
        if (foundQuotes.length === 0) {
            console.log("No quotes said by " + requestedName);
            interaction.editReply(`No quotes said by ${requestedName}`)
        }
        else {
          sendQuotesToChannel(foundQuotes, requestedName, quoteCounter);
        }
    } 

    async function sendQuotesToChannel(quotes, name, quoteCount) {       
        let maxMsgLen = 1800;
        let msgChunks = [];
        let currChunk = [];
        let currLen = 0;

        quotes.forEach(quote => { 
          console.log(msgChunks); 
          const lineBreakQuote = quote;
          if (currLen + lineBreakQuote.length > maxMsgLen) {
            msgChunks.push(currChunk);
            currChunk = [];
            currLen = 0;
          }
          currChunk.push(lineBreakQuote);
          currLen += lineBreakQuote.length;
        });

        if (currChunk.length > 0) {
          msgChunks.push(currChunk);
        }

      //interaction.reply(`All quotes said by ${name}: \n ${quotes}`);
      await interaction.editReply(`All quotes said by ${name} (${quoteCount}):\n ${msgChunks[0].join('')}`);

      for (let i = 1; i < msgChunks.length; i++) {
        if (msgChunks[i].length > 0 ) {
          await interaction.followUp(msgChunks[i].join(''));
        }
      }

    }    
    const auth = await authorize();
    await printDocTitle(auth);
    }, 
};
