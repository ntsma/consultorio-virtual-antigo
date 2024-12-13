# Usar a imagem oficial do Node.js
FROM node:18.14.2

# Definir o diretório de trabalho dentro do container
WORKDIR /home/app

# Copiar o package.json e package-lock.json para o diretório de trabalho
COPY app/package*.json ./

# Instalar as dependências da aplicação
RUN npm install

# Copiar todos os arquivos da aplicação para o diretório de trabalho
COPY app/ .

# Ajustar as permissões
RUN chown -R node:node /home/app

# Expor as portas necessárias
EXPOSE 3010 3011

# Definir o usuário para executar o container
USER node

# Executar a aplicação diretamente
CMD ["npm", "start"]
