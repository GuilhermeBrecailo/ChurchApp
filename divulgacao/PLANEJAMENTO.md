# Planejamento de Divulgação — ChurchApp

> Documento vivo. Atualizar conforme formos decidindo e testando coisas — não é um plano fechado, é o registro do que sabemos, do que já rodamos e do que ainda precisamos decidir juntos.

Última atualização: 2026-08-15 (tarde)

## 0. Meta

**5 a 10 igrejas clientes pagantes até o fim de 2026.** Meta enxuta — foco em validar o produto com poucos clientes reais antes de pensar em escalar aquisição.

## 1. O produto, em uma frase

ChurchApp é um SaaS de gestão de igreja: membros, ministérios, escalas (com cifra automática por instrumento), devocional, avisos e pedidos de oração — tudo num app só, no lugar de planilha + grupo de WhatsApp.

## 2. Onde estamos agora

**Feito:**
- **Landing pública comercial `/comece` redesenhada e no ar** em 2026-08-15 — resolve os 2 itens críticos do diagnóstico de SEO (ver seção 6.2): existe uma página pública de conversão (antes só existia `/c/[slug]`, que serve igreja já-cliente) e a meta description agora é específica e com palavra-chave, com Open Graph configurado. Deploy feito e confirmado em produção (`churchapp.site/comece`, HTTP 200, já aparece no `sitemap.xml`).
- Perfil `@app_church` no Instagram criado, bio revisada, ícone oficial do app como foto.
- **Dados estruturados (schema.org) implementados em `/comece`** e, mais importante, **corrigido um bug real de SSR**: a página estava caindo na regra geral `"/**": ssr:false` do `nuxt.config.ts` (pensada pra rotas autenticadas) e nunca tinha sido adicionada à lista de exceção — Google e bots de link preview (WhatsApp/Instagram) só viam uma casca HTML vazia de 2.8KB, sem título, descrição nem conteúdo algum. Corrigido e confirmado em produção (57KB de HTML renderizado, título/descrição/schema.org presentes na resposta bruta). Isso fecha o SEO técnico por completo.
- **14 DMs enviadas no Instagram** até agora (12 em 2026-08-15 de manhã + 2 à tarde), pra igrejas do Paraná (Curitiba, Londrina, Maringá, Ponta Grossa, Cascavel, Foz do Iguaçu, Guarapuava, Toledo, São José dos Pinhais). Lista completa e status de cada uma em [`../api/leads/leads-instagram-pr-2026-08-15.csv`](../api/leads/leads-instagram-pr-2026-08-15.csv).
- Roteiro de abordagem por DM com aprendizados reais (não teoria) em [`../api/leads/roteiro-dm-instagram.md`](../api/leads/roteiro-dm-instagram.md).

**Aprendizados já validados na prática (2026-08-15):**
- Contas grandes de igreja costumam restringir DM de quem não segue — o Instagram bloqueia com "não aceita novas solicitações de contato de todos". Solução: seguir a conta antes de mandar a mensagem.
- Mencionar "quanto tempo a igreja existe" na personalização soa deslocado — o gancho certo é a estrutura/ministérios, não a idade da instituição.
- Empurrar "plano grátis" logo na primeira mensagem soa vendedor demais. Abordagem: mostrar o app primeiro, oferecer o benefício (período grátis) como bônus depois que a igreja topar ver a demo — não como isca inicial.
- Pelo menos uma igreja pesquisada já usa concorrente (Eklesia Online) — vale checar isso antes de investir tempo num lead.
- Mesmo seguindo a conta antes de mandar, algumas ainda bloqueiam a DM ("não aceita solicitações de todos") — nem sempre dá pra contornar, só tentar de novo depois ou usar outro canal.

## 3. Concorrência (mapeada via Instagram em 2026-08-15)

| Concorrente | Perfil | Observação |
|---|---|---|
| Eklesia Online | `gestaoweb.eklesiaonline.com.br` | Já visto sendo usado por pelo menos 1 igreja pesquisada |
| Elo Church | `@elochurch.app` | 35 seguidores, 1 post — pequeno |
| Holynk | `@holynk.app` | 2 seguidores, 0 posts — recém-lançado |
| Connect WL | `@connect_wl` | Não investigado a fundo ainda |
| Trilha da Fé | `@trilhadafe.app` | Não investigado a fundo ainda |
| Redil App | `@redilapp` | Não investigado a fundo ainda |

**Leitura inicial:** o mercado parece nascente/fragmentado — não tem um concorrente grande e estabelecido dominando. Isso é bom (espaço aberto) e ruim (mercado ainda não validado, igrejas talvez não saibam que precisam disso). Vale confirmar essa leitura junto com você antes de assumir como verdade.

## 4. Público-alvo (hipótese atual)

- **Quem decide:** o pastor titular ou um líder de ministério com abertura do pastor.
- **Perfil que mais converte (hipótese):** igreja de porte médio (500-3000 seguidores no Instagram), com múltiplos ministérios ativos (kids, jovens, louvor, células) — grande o suficiente pra sentir a dor de coordenar tudo por WhatsApp, pequena o suficiente pra não ter um sistema caro já contratado.
- **Sinal de baixa prioridade:** perfil quase abandonado (poucos posts, sem atividade recente) ou já usando um concorrente.
- **Ainda não validado:** essa hipótese de porte médio é um chute educado a partir de ~15 perfis olhados hoje. Precisa de mais dados (taxa de resposta por porte de igreja) pra confirmar.

## 5. Funil

```
Descoberta          →   Prova social         →   Trial              →   Conversão Pro
SEO + Instagram DM  →   Página pública de     →   Cadastro rápido,   →   Upsell quando sente
+ indicação          →  igrejas clientes,     →   sem cartão          →   falta de relatório/
                        depoimentos, demo                                 notificação em massa
```

## 6. Frentes de trabalho

### 6.1 Instagram DM (ativa, pausada por hoje)
**Status:** 14 leads contatados, 1 pulado (usa concorrente), 1 bloqueado (DM recusada mesmo seguindo), 27 restantes na lista do PR (43 no total).
**Decisão (2026-08-15):** aprofundar no Paraná primeiro — terminar os leads restantes antes de abrir outro estado. Mantém foco e dá pra medir taxa de resposta num mercado só antes de escalar geografia.
**Pausa de hoje:** já bateu ~15-20 tentativas no dia (teto de segurança pra não levantar suspeita de spam numa conta nova) — retoma nos próximos dias, no mesmo ritmo.
**Próximos passos:** continuar ~15-20 DMs/dia até zerar os 27 restantes, acompanhar respostas.
**Métrica a observar:** taxa de resposta e taxa de "topou ver demo" — ainda sem dado de resposta (outreach começou hoje).

### 6.2 SEO técnico (concluído)
Auditoria já feita (sessão anterior), apontava 2 itens **críticos** que travavam qualquer tráfego orgânico:
1. ~~Não existe landing pública comercial~~ — **resolvido em 2026-08-15**, `/comece` redesenhada e no ar.
2. ~~Meta description fixa e genérica, sem palavra-chave~~ — **resolvido em 2026-08-15**, título/description/OG específicos em `/comece`.
Itens de prioridade média:
- sitemap.xml e robots.txt — **já existem e funcionam** (`@nuxtjs/sitemap` já instalado, `/comece` já aparece no `sitemap.xml` de produção).
- Dados estruturados (schema.org / JSON-LD) — **implementado em 2026-08-15** (`Organization` + `SoftwareApplication`).
- **Bug crítico achado e corrigido em 2026-08-15:** `/comece` não tinha SSR habilitado (caía na regra geral `ssr:false` do `nuxt.config.ts`) — Google/bots só viam uma casca vazia. Corrigido e confirmado em produção.
**Não sobrou nenhum item técnico de SEO pendente** — próximo passo real da frente de SEO é só acompanhar indexação no Google Search Console (ainda não configurado, ver seção 9).

### 6.3 Conteúdo social (roteirizado, não produzido)
Formatos já definidos: Reels "antes/depois" da escala, carrossel "5 sinais que sua igreja precisa de um app", enquete de dor no Stories, depoimento de pastor real, print de funcionalidade, tutorial "crie sua escala em 1 minuto".
**Decisão (2026-08-15):** divisão de trabalho definida — Claude escreve o roteiro/texto de cada peça, Guilherme (ou alguém do time) grava e edita. Falta: agendar quando começa a gravação e achar um pastor cliente disposto a dar depoimento (item 6.4 ajuda aqui).

### 6.4 Indicação boca a boca
Ainda não ativado formalmente — só acontece organicamente. Pode virar programa formal (ex: desconto pra quem indica) quando tivermos as primeiras igrejas clientes via outreach.

### 6.5 Mídia paga
**Decisão (2026-08-15):** existe verba pra testar. Não é prioridade imediata — faz mais sentido depois que a landing pública (seção 6.2) existir, senão o anúncio manda tráfego pra um lugar que não converte. Guardar como próxima frente depois do SEO técnico.

## 7. Métricas de acompanhamento

Ainda não temos um lugar central rastreando isso — hoje é só a coluna "Status" do CSV de leads. Pra decidir juntos: vale montar uma planilha/dashboard simples com:
- Leads contatados (por canal, por dia)
- Taxa de resposta
- Demos agendadas
- Cadastros (trial)
- Conversões pagas

## 8. Decisões tomadas

- **2026-08-15 — Meta:** 5-10 igrejas pagantes até fim de 2026.
- **2026-08-15 — Prioridade SEO vs. outreach:** os dois em paralelo. Outreach manual continua rodando (não depende do Guilherme pra acontecer); SEO técnico vira uma frente de código separada, planejada e implementada à parte.
- **2026-08-15 — Geografia:** aprofundar no Paraná primeiro, terminar os ~25 leads restantes antes de abrir outro estado.
- **2026-08-15 — Conteúdo social:** Claude escreve roteiro/texto, Guilherme/time grava e edita.
- **2026-08-15 — Orçamento de mídia paga:** existe verba pra testar, mas só entra depois que a landing pública existir (item 6.5).
- **2026-08-15 — Landing `/comece` no ar:** os 2 blocos críticos de SEO (landing pública + meta description) foram resolvidos junto com o redesign de conversão da página. Mídia paga (item 6.5) já pode ser considerada, já não depende mais de nada de código.

## 9. Perguntas em aberto — vamos decidir juntos

- Com a landing `/comece` no ar e o SEO técnico fechado, a mídia paga (6.5) deixou de estar bloqueada por código — vale decidir se/quando testar tráfego pago apontando pra ela.
- Google Search Console/Bing Webmaster nunca foram configurados pro domínio — vale cadastrar agora que a landing tem SSR de verdade, pra começar a monitorar indexação e submeter o sitemap manualmente (acelera a primeira indexação em vez de esperar o Google achar sozinho).
- Conteúdo social (6.3) segue sem data — falta agendar gravação e achar um pastor cliente pra depoimento.

---
*Arquivos relacionados: [`api/leads/`](../api/leads/) (leads e roteiro de DM), [`CLAUDE.md`](../CLAUDE.md) (arquitetura do produto).*
