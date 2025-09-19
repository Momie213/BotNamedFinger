const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const mandemQuotesID = '1HnleC6fnhQDRynVGHI1QRg6BKKtDwjjOpKcCDLAoKLQ';

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

module.exports = {
    data: new SlashCommandBuilder() 
        .setName('quotebooklink')
        .setDescription('Sends the link to the quote book'),

    async execute(interaction) {
        await interaction.reply(`Quote Book Link: https://docs.google.com/document/d/1HnleC6fnhQDRynVGHI1QRg6BKKtDwjjOpKcCDLAoKLQ/edit?usp=sharing`)
    }
}