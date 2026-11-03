# Convite para instalar o ChurchApp

## Intenção

Convidar pessoas que ainda usam o ChurchApp pelo navegador a adicioná-lo à tela inicial, com uma orientação adequada para Android e iOS.

## Solução escolhida

Mostrar um banner discreto depois de alguns segundos de uso. Ao dispensá-lo, aguardar sete dias antes de exibi-lo novamente. No Android, o botão usa o convite nativo do navegador quando disponível. No iOS, o botão abre instruções curtas para adicionar o site à Tela de Início pelo menu Compartilhar.

O convite deve aparecer globalmente apenas em Android e iOS quando a página estiver em modo navegador e o ChurchApp não estiver instalado. Após a instalação, ocultar o aviso. Manter o fluxo separado das notificações push existentes.

## Objetivos e limites

- Detectar instalação pelo modo `standalone` e pelo indicador do Safari no iOS.
- Usar `beforeinstallprompt` e `appinstalled` onde o navegador oferece esses eventos.
- Não pedir permissão para notificações push como parte da instalação.
- Não apresentar o convite no desktop.
- Não fazer chamadas à API nem alterar autenticação, backend ou banco de dados.
- Persistir apenas a data de dispensa no armazenamento local do navegador.

## Abordagens consideradas

- **Banner discreto com instruções por plataforma (escolhida):** segue o padrão de aviso já usado no app e deixa a pessoa continuar usando a tela. O Android abre o prompt nativo; o iOS explica o passo manual exigido pelo Safari.
- **Modal automático:** teria mais destaque, mas interromperia o login e o uso do app.
- **Botão fixo no menu:** seria menos intrusivo, porém não atenderia ao pedido de avisar automaticamente quem ainda não instalou.

## Restrições de plataforma

O evento `beforeinstallprompt` não é suportado no iOS. A instalação em iPhone/iPad precisa ser concluída pela pessoa no navegador. O app não deve fingir que pode abrir esse diálogo diretamente.

## Verificação

Compilar o frontend e conferir manualmente os estados de navegador, banner dispensado, instalação detectada e instruções de iOS, sem acionar API ou permissão de push.
