## Context

O model `Crunch` tem: nome, logo, endereço (city, road, state, localZipCode, complement, number), `inviteCode` e `isActive`. Não há campo de "horários dos cultos" estruturado — horários serão um campo livre de texto adicionado ao model ou simplificado como texto no admin.

## Goals / Non-Goals

**Goals:**
- Página pública `/church/[inviteCode]` acessível sem autenticação
- Exibir logo, nome, endereço e botão de entrada
- Endpoint público no backend sem guard JWT

**Non-Goals:**
- Horários estruturados (campo de texto livre é suficiente para MVP)
- SEO/meta tags avançadas
- Mapa de localização

## Decisions

**Rota com inviteCode na URL**: permite compartilhar o link diretamente com o código embutido. O visitante acessa, vê a igreja e clica em "Entrar" que leva para `/join?code=XXX` com código pré-preenchido.

**Endpoint público sem JWT**: nova rota `GET /api/public/church/:inviteCode` registrada fora do guard Keycloak. Retorna apenas dados públicos (nome, logo, cidade, estado).

**Campo `schedule` como texto livre**: adicionar `schedule String?` ao model `Crunch` para o pastor informar horários dos cultos em texto livre (ex: "Domingos às 18h | Quarta às 19h30").

## Risks / Trade-offs

- [Expor inviteCode na URL] → O inviteCode já é público por natureza (compartilhado para ingresso). Aceitável.
- [Migration para campo schedule] → Campo nullable, migration simples sem impacto nos dados existentes.
