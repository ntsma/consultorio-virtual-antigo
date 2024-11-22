#!/bin/sh
set -e
# Navegar para o diretório da aplicação
cd /home/app

chown -R node:node /home/app
chmod -R 755 /home/app

# Instalar as dependências (se necessário, como fallback)
npm install

# Executar a aplicação
npm start

