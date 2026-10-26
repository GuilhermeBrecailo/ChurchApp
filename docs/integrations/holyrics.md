# Integração com Holyrics

## O que a integração faz

Cada igreja pode conectar seu próprio Holyrics usando a API key e um token do API Server. A conexão usa o relay HTTPS oficial, então o ChurchApp hospedado na VPS não precisa acessar a rede local da igreja. O computador com Holyrics deve estar ligado, conectado à internet e com o API Server habilitado.

Depois de conectar, a tela de Integrações verifica as permissões do token e mostra quais recursos estão liberados. Para enviar músicas da escala, o token precisa de `SearchLyrics` e `AddLyricsToPlaylist`. Permissões de leitura podem liberar consulta da programação selecionada, do item projetado e busca na biblioteca de áudios, vídeos e imagens. A tela também permite consultar esses dados sem alterar a projeção. Cada recurso exige as ações correspondentes listadas na tela.

O ChurchApp não cria músicas nem altera a playlist selecionada. A música precisa existir no catálogo do Holyrics; itens não encontrados ou com correspondência ambígua ficam informados no resultado da sincronização. Consultas de programação/apresentação e biblioteca são somente leitura. A API também oferece ações para exibir letras, versículos, textos e mídias e para avançar/voltar slides; elas alteram o telão ao vivo e ainda não estão ligadas à interface do ChurchApp.

## Onde usar

1. Acesse **Configurações → Integrações → Holyrics** como pastor ou administrador.
2. No API Server, crie um token com `GetTokenInfo`; adicione `SearchLyrics` e `AddLyricsToPlaylist` para sincronizar músicas.
3. Informe a API key e o token no ChurchApp e selecione **Testar e conectar**.
4. Selecione **Verificar recursos** para conferir as permissões reconhecidas pelo Holyrics.
5. Na escala, abra o detalhe de um culto com músicas e selecione **Enviar para Holyrics**.
6. Antes do envio, selecione no Holyrics a playlist que deve receber as músicas.

As credenciais ficam vinculadas à igreja e não são devolvidas pela API nem exibidas depois de salvas. A referência da API oficial está em [Holyrics/API-Server](https://github.com/holyrics/API-Server).
