## ADDED Requirements

### Requirement: Modo telão exibe letra sem chrome do app
O sistema SHALL abrir um overlay fullscreen com fundo preto e texto branco em fonte grande ao clicar em "Telão", sem AppBar, BottomNav, abas ou toolbar visíveis.

#### Scenario: Abrir modo telão
- **WHEN** o usuário clica em "Telão" no viewer de letra
- **THEN** o sistema abre fullscreen com fundo preto, texto branco e botão X discreto no canto superior direito

#### Scenario: Fechar modo telão
- **WHEN** o usuário clica no botão X ou pressiona Escape
- **THEN** o modo telão é fechado e o viewer normal é restaurado

### Requirement: Toque pausa e retoma auto-scroll no modo telão
O sistema SHALL pausar o auto-scroll enquanto o usuário mantém o dedo na tela e retomar ao soltar.

#### Scenario: Pausar scroll com toque
- **WHEN** o usuário toca e segura a tela durante o auto-scroll
- **THEN** o scroll é pausado até o usuário soltar

### Requirement: Swipe horizontal navega entre músicas da playlist
O sistema SHALL trocar para a próxima ou anterior música da playlist da escala ao detectar swipe horizontal, desde que haja músicas adjacentes.

#### Scenario: Swipe para próxima música
- **WHEN** o usuário faz swipe para a esquerda e há uma próxima música na playlist
- **THEN** o sistema exibe a letra da próxima música

#### Scenario: Swipe para música anterior
- **WHEN** o usuário faz swipe para a direita e há uma música anterior na playlist
- **THEN** o sistema exibe a letra da música anterior

#### Scenario: Sem música adjacente
- **WHEN** o usuário faz swipe mas não há mais músicas na direção indicada
- **THEN** o swipe não tem efeito (sem navegação)
