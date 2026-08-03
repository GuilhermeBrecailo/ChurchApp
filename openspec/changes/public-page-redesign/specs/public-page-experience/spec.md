## ADDED Requirements

### Requirement: Mural de publicações na página pública
A página pública SHALL exibir as publicações públicas da igreja em uma seção de mural, quando houver ao menos uma. A primeira publicação SHALL receber destaque visual (layout maior) e as demais SHALL aparecer em grade. Cada item SHALL mostrar a foto (quando houver), o título, o texto e o vídeo (quando houver).

#### Scenario: Mural aparece com publicações
- **WHEN** a igreja tem publicações públicas e a página pública é aberta
- **THEN** a seção "Momentos da igreja" é exibida com as publicações, a primeira em destaque

#### Scenario: Sem publicações, sem mural
- **WHEN** a igreja não tem nenhuma publicação pública
- **THEN** a seção de mural não é renderizada

#### Scenario: Publicação sem foto
- **WHEN** uma publicação pública não tem foto
- **THEN** o item ainda aparece no mural com título e texto, sem quebrar o layout

### Requirement: Rodapé da página pública
A página pública SHALL exibir um rodapé quando houver dados de rodapé (endereço, contatos, redes ou horários). O rodapé SHALL mostrar apenas os blocos com conteúdo: endereço com link "Abrir no mapa", contatos clicáveis (WhatsApp, telefone, e-mail), ícones das redes preenchidas e um resumo dos horários de culto.

#### Scenario: Rodapé com dados
- **WHEN** a igreja preencheu contatos e redes e a página pública é aberta
- **THEN** o rodapé mostra endereço, contatos clicáveis, ícones das redes e os horários de culto

#### Scenario: Contatos viram links acionáveis
- **WHEN** o rodapé mostra WhatsApp, telefone e e-mail
- **THEN** cada um abre a ação correspondente (WhatsApp, discagem, e-mail)

#### Scenario: Rodapé oculto sem dados
- **WHEN** a igreja não tem endereço, contatos, redes nem horários
- **THEN** o rodapé não é renderizado
