// --- Importaciones ---
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

// --- Configuración del servidor Express ---
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Railway asigna su propio puerto, así que usamos process.env.PORT
const PORT = process.env.PORT || 3000;

// --- Configuración del cliente de Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Variables de entorno ---
const CHANNEL_ID = process.env.CHANNEL_ID;
const LOGCHANNEL = process.env.LOGCHANNEL;
const LOCATION = process.env.LOCATION || 'Madrid,ES';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL) || 3600000; // 1 hora por defecto

// --- Función para obtener el clima ---
async function getWeather() {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${LOCATION}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.main) {
      console.error('⚠️ Error obteniendo datos meteorológicos:', data);
      return null;
    }

    const description = data.weather[0].description;
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const feels_like = data.main.feels_like;

    const embed = new EmbedBuilder()
      .setTitle(`🌤️ Clima actual en ${data.name}`)
      .setDescription(`${description.charAt(0).toUpperCase() + description.slice(1)}`)
      .addFields(
        { name: '🌡️ Temperatura', value: `${temp} °C`, inline: true },
        { name: '🥵 Sensación térmica', value: `${feels_like} °C`, inline: true },
        { name: '💧 Humedad', value: `${humidity}%`, inline: true }
      )
      .setColor(0x00bfff)
      .setTimestamp();

    return embed;
  } catch (err) {
    console.error('❌ Error en getWeather:', err);
    return null;
  }
}

// --- Función para enviar actualizaciones al canal ---
async function sendWeatherUpdate() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const embed = await getWeather();

    if (channel && embed) {
      await channel.send({ embeds: [embed] });
      console.log('📡 Reporte meteorológico enviado correctamente');
    } else {
      console.error('⚠️ No se encontró el canal o los datos de clima');
    }
  } catch (err) {
    console.error('❌ Error enviando mensaje:', err);
  }
}

// --- Evento moderno: clientReady ---
client.once('clientReady', async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);
  console.log('🌤️ Variables cargadas correctamente:');
  console.log({
    CHANNEL_ID,
    LOCATION,
    WEATHER_API_KEY: WEATHER_API_KEY ? '✅ set' : '❌ missing',
    UPDATE_INTERVAL,
  });

  // Enviar el primer reporte
  await sendWeatherUpdate();

  // Enviar reportes periódicos
  setInterval(sendWeatherUpdate, UPDATE_INTERVAL);
});

// --- Webhook opcional para Railway (logs o deploys) ---
app.post('/ferrocarril', async (req, res) => {
  const body = req.body;
  try {
    const logChannel = await client.channels.fetch(LOGCHANNEL);
    if (!logChannel) return res.status(404).send('Canal de logs no encontrado');

    const embed = new EmbedBuilder()
      .setTitle(`🚂 Evento Railway`)
      .setDescription(`Proyecto: ${body.project?.name || 'Desconocido'}\nEstado: ${body.status || 'N/A'}`)
      .setColor(body.status === 'SUCCESS' ? 0x00ff40 : 0xff0000)
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
    res.sendStatus(204);
  } catch (err) {
    console.error('⚠️ Error en webhook de Railway:', err);
    res.status(500).send('Error interno');
  }
});

// --- Mantiene el servidor activo ---
app.listen(PORT, () => {
  console.log(`🌐 Webhook activo en puerto ${PORT}`);
});

// --- Manejo de errores global ---
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

// --- Inicia sesión en Discord ---
client.login(process.env.DISCORD_TOKEN);
