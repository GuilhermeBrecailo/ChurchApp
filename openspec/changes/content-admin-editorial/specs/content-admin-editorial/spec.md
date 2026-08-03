## ADDED Requirements

### Requirement: Aba de cadastro de conteúdo com visual editorial
A aba Conteúdo do admin SHALL usar o mesmo tratamento visual da página pública — fundo "papel" creme, títulos em Fraunces e cartões com borda fina — e SHALL usar a cor da igreja (accentColor) como realce no lugar do roxo padrão, com suporte a tema claro e escuro. O comportamento e os dados SHALL permanecer inalterados.

#### Scenario: Cadastro adota a cor da igreja
- **WHEN** a igreja definiu uma cor de destaque e o pastor abre a aba Conteúdo
- **THEN** botões, campos em foco, chips e ícones dos cartões aparecem na cor da igreja, sobre o fundo "papel"

#### Scenario: Sem cor definida usa o padrão
- **WHEN** a igreja não escolheu uma cor de destaque
- **THEN** o cadastro usa a cor padrão (terracota) como realce, mantendo o mesmo layout editorial

#### Scenario: Tema escuro
- **WHEN** o painel está em tema escuro
- **THEN** o fundo "papel" e os cartões usam a versão escura, mantendo contraste legível e o realce da cor da igreja
