# Usa Node oficial
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos del proyecto al contenedor
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto (solo si tu bot escucha peticiones)
EXPOSE 3000

# Comando que lanza tu bot
CMD ["node", "index.js"]