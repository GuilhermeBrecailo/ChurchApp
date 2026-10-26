# MCP local do Holyrics para o ChurchApp

Servidor MCP local, separado do app, que consulta o Holyrics pela API Server oficial. Ele serve ao Codex na máquina que executa o Holyrics. O ChurchApp hospedado na VPS usa o relay HTTPS oficial implementado pela própria aplicação; não tente apontar a VPS para este MCP local. Nesta primeira versão, todas as ferramentas são somente leitura: não avançam slides, não exibem mídia e não alteram playlists ou programação.

## Ferramentas

- `holyrics_status`: verifica versão da API e permissões do token.
- `holyrics_current_schedule`: consulta a programação selecionada no Holyrics.
- `holyrics_current_presentation`: consulta o item/slide atualmente projetado; opcionalmente inclui os slides.
- `holyrics_search_songs`: busca músicas por título/artista e retorna metadados, sem baixar letras completas.
- `holyrics_search_media`: busca áudios, vídeos ou imagens por nome.

## Configuração

1. No Holyrics, abra **Arquivo > Configurações > API Server** e ative o servidor local.
2. Em **Gerenciar permissões**, crie um token limitado às consultas necessárias: `GetTokenInfo`, `GetCurrentSchedule`, `GetCurrentPresentation`, `SearchLyrics`, `GetAudios`, `GetVideos` e `GetImages`.
3. Copie `.env.example` para `.env` nesta pasta e informe a URL local exibida nas configurações do Holyrics e o token. Não envie o token no chat nem o salve no Git.
4. Instale e compile o pacote:

   ```powershell
   cd tools/holyrics-mcp
   npm install
   npm run build
   ```

O arquivo `.env` e as dependências ficam ignorados pelo Git. O MCP lê `.env` ao iniciar e nunca inclui o token nas respostas.

## Conectar ao Codex

Depois de compilar e configurar `.env`, registre o servidor no Codex usando o caminho absoluto do executável `node` e do arquivo `dist/index.js`. Em PowerShell, a partir da raiz do projeto:

```powershell
codex mcp add churchapp-holyrics -- node "C:\caminho\do\projeto\tools\holyrics-mcp\dist\index.js"
```

Feche e reabra a sessão do Codex. Se o Codex estiver rodando em outro computador, este MCP local precisa ser instalado na máquina que executa o Holyrics, pois a conexão usa a API Server local.

## Segurança e limites

- Use apenas uma URL `http://` da rede local, como `127.0.0.1` ou o IP local do computador com Holyrics.
- O token permanece em `.env`; erros de rede não imprimem a URL com o token.
- A API do Holyrics controla permissões por ação. Conceda apenas as permissões de leitura usadas acima.
- A primeira versão não oferece ações de transmissão ou edição. Isso evita que uma chamada do assistente altere acidentalmente a projeção ao vivo.

Referência da API: [Holyrics API Server](https://github.com/holyrics/API-Server).
