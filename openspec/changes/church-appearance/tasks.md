## 1. Banco de dados

- [ ] 1.1 Colunas `textColor` e `fontFamily` (chave curada) em `Crunch`; migration aditiva + `prisma generate`

## 2. Backend

- [ ] 2.1 `updateOwnChurch` aceita `textColor`/`fontFamily`, validando `fontFamily` contra a lista permitida
- [ ] 2.2 `GetPublicChurchBySlug`/`publicChurchAdapters` retornam `logo`, `accentColor`, `textColor`, `fontFamily`

## 3. Frontend

- [ ] 3.1 Seção "Aparência" no admin: upload de logo (reusar `uploadChurchPhoto`), cor de destaque (já existe), cor do texto, seletor de fonte (lista curada)
- [ ] 3.2 Página pública aplica `--church-accent`, cor do texto e família de fonte via variáveis, com contraste garantido
- [ ] 3.3 Restringir fontes às já carregadas (sem novas fontes externas por causa de rede/CSP)

## 4. Validação

- [ ] 4.1 `npm run validate` verde
- [ ] 4.2 Teste manual: trocar logo, cor do texto e fonte e ver refletido na página pública, legível em claro e escuro
