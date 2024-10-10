# Usar a imagem oficial do Node.js
FROM node:18.14.2

# Definir o diretório de trabalho dentro do container
WORKDIR /home/app

# Copiar o package.json e package-lock.json para o diretório de trabalho
COPY app/package*.json ./

# Instalar as dependências da aplicação
RUN npm install

# Copiar todos os arquivos da aplicação para o diretório de trabalho no container
COPY app/ .

# Expor a porta 3000 para acesso à aplicação
EXPOSE 3000

# Rodar o script init.sh ou iniciar a aplicação diretamente
CMD ["sh", "/home/init.sh"]
