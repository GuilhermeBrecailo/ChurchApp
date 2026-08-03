## 1. Backend

- [x] 1.1 Lib de extração escolhida: `pdf-parse@1.1.1` (pura JS, sem dependência nativa — evitada a v2, que depende de `@napi-rs/canvas`); limite de 10 MB reaproveitado do upload de PDF existente
- [x] 1.2 Serviço de separação em músicas (`api/src/application/Services/Department/PdfSongExtraction.ts`): cada página do PDF é tratada como uma música (heurística mais confiável para setlists de igreja); dentro de uma página, blocos separados por 2+ linhas em branco viram músicas separadas; primeira linha não vazia = título, resto = letra
- [x] 1.3 Endpoint `POST /api/church/departments/:id/songs/import-pdf/preview` — recebe o PDF, devolve `{ songs: [{title, lyrics}] }` sem persistir nada
- [x] 1.4 PDF sem texto extraível (escaneado/imagem) retorna erro claro em vez de criar músicas vazias
- [x] 1.5 Endpoint `POST /api/church/departments/:id/songs/import-pdf/confirm` — recebe a lista revisada e cria as músicas em lote (transação), na ordem enviada
- [x] 1.6 Autorização: mesma permissão de `SONG_CREATE` do cadastro manual de música (pastor/admin, líder, ou cargo de ministério com a permissão)
- [x] 1.7 6 testes unitários da heurística de separação (multi-página, multi-música por página, música única não quebrada por linha em branco simples, páginas em branco ignoradas, PDF sem texto, título muito longo truncado)

## 2. Frontend

- [x] 2.1 Botão "Importar do PDF" na aba de músicas do ministério, ao lado de "Nova música"
- [x] 2.2 Tela de revisão: lista editável (título + letra) com opção de remover cada música antes de confirmar
- [x] 2.3 Confirmar cria as músicas e elas entram no repertório do ministério, na ordem detectada no PDF

## 3. Validação

- [x] 3.1 `npm run validate` verde (lint + typecheck + 113 testes + build)
- [ ] 3.2 Teste manual com um PDF real de 3 músicas → 3 músicas criadas — requer app + banco + um PDF de exemplo
- [ ] 3.3 Teste com PDF escaneado (imagem) → aviso, sem criar músicas em branco — requer app + banco
