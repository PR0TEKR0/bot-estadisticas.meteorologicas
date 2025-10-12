import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const LOCATION = process.env.LOCATION;
const API_KEY = process.env.WEATHER_API_KEY;
const INTERVAL = parseInt(process.env.UPDATE_INTERVAL) || 3600000; // 1 hora

async function getWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${LOCATION}&appid=${API_KEY}&units=metric&lang=es`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.main) return null;

  return `🌤️ Clima en ${data.name}: ${data.weather[0].description}, ${data.main.temp}°C`;
}

async function sendWeatherUpdate() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const message = await getWeather();

  if (channel && message) {
    await channel.send(message);
    console.log('📡 Enviado reporte meteorológico');
  }
}

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  sendWeatherUpdate(); // Enviar al iniciar
  setInterval(sendWeatherUpdate, INTERVAL); // Actualizar cada X tiempo
});

client.login(process.env.DISCORD_TOKEN);
