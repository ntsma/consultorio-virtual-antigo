#!/bin/sh

# Navegar para o diretório da aplicação
cd /home/app

chown -R 1000:node /home/app
chmod -R ug+rwx /home/app

# Instalar as dependências (se necessário, como fallback)
npm install

# Executar a aplicação
npm start

