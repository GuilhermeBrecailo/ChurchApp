## 1. Backend

- [ ] 1.1 Escolher e adicionar lib de extração de texto de PDF (ex.: `pdf-parse`); tratar limite de páginas/tamanho
- [ ] 1.2 Serviço de separação em músicas (heurística: título em CAIXA ALTA / "Música N" / quebras) retornando `[{ title, lyrics }]`
- [ ] 1.3 Endpoint que recebe o PDF e devolve as músicas sugeridas (sem persistir)
- [ ] 1.4 Detectar PDF sem texto (imagem) e retornar aviso claro (OCR fica fora do escopo inicial)
- [ ] 1.5 Confirmar/criar em lote as músicas no ministério (reusar o create de música existente)
- [ ] 1.6 Autorização = permissão de gerenciar música do ministério

## 2. Frontend

- [ ] 2.1 No ministério, botão "Importar do PDF" → upload
- [ ] 2.2 Tela de revisão das músicas detectadas (editar título/letra, remover as erradas)
- [ ] 2.3 Confirmar → cria as músicas e monta a playlist

## 3. Validação

- [ ] 3.1 `npm run validate` verde
- [ ] 3.2 Teste manual com um PDF real de 3 músicas → 3 músicas criadas
- [ ] 3.3 Teste com PDF escaneado (imagem) → aviso, sem criar músicas em branco
