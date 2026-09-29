# Integração com Holyrics

## O que a integração faz

Cada igreja pode conectar sua própria conta do Holyrics usando a API key e o token do serviço. Depois da conexão, uma pessoa com permissão para gerenciar a escala pode enviar as músicas de uma escala para a playlist atualmente selecionada no Holyrics.

O ChurchApp não cria músicas, não altera a playlist selecionada e não controla a projeção. A música precisa existir no catálogo do Holyrics; itens não encontrados ou com correspondência ambígua ficam informados no resultado da sincronização.

## Onde usar

1. Acesse **Configurações → Integrações → Holyrics** como pastor ou administrador.
2. Informe a API key e o token gerados pelo servidor oficial do Holyrics.
3. Na escala, abra o detalhe de um culto com músicas e selecione **Enviar para Holyrics**.
4. Antes do envio, selecione no Holyrics a playlist que deve receber as músicas.

As credenciais ficam vinculadas à igreja e não são devolvidas pela API nem exibidas depois de salvas. A referência da API oficial está em [Holyrics/API-Server](https://github.com/holyrics/API-Server).
