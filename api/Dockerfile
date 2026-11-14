# Usa a versão leve do Node 20
FROM node:20-alpine

RUN apk add --no-cache curl

# Cria a pasta do app dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependências primeiro (cache layer)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código
COPY . .

# Gera o cliente do Prisma (essencial!)
RUN npx prisma generate

# Expõe a porta que o Fastify vai usar
EXPOSE 8000

# Comando para rodar o servidor em modo de desenvolvimento
CMD ["npm", "run", "dev"]
