## Why

Montar o repertório música a música é lento. O pastor/ministro quer subir **um PDF com as letras** e o sistema já criar as músicas e a playlist — ex.: um PDF com 3 músicas vira 3 músicas na escala automaticamente.

> Status: proposta (spec + tarefas). Ainda não implementado.

## What Changes

- Ao subir um **PDF de repertório**, o sistema **extrai o texto**, **separa em músicas** (por marcadores de título/quebra) e **cria as músicas** no ministério, montando a playlist da escala.
- Cada música extraída vira um registro com **título** e **letra**; o usuário revisa/edita antes de confirmar (a extração é uma sugestão, não um cadastro cego).
- Reaproveita o upload de PDF (`POST /api/church/departments/:id/uploads/pdf`) já existente.

## Capabilities

### New Capabilities

- `pdf-song-import`: Importação de repertório a partir de um PDF — extrai texto, separa em músicas (título + letra) e cria a playlist, com revisão antes de confirmar.

### Modified Capabilities

<!-- Sem specs arquivadas; nada a modificar em nível de spec. -->

## Impact

- **Backend (api)**: novo passo de **extração de texto de PDF** (ex.: `pdf-parse`/`pdfjs`) sobre o arquivo enviado; heurística de **separação em músicas** (título em CAIXA ALTA, linhas em branco, "Música N", etc.); endpoint que devolve as músicas sugeridas (título + letra) sem persistir, e outro (ou o create em lote existente) para confirmar e criar. Considerar limite de tamanho/páginas e PDFs só-imagem (sem texto) — nesse caso, avisar que precisa de OCR (fora do escopo inicial).
- **Frontend (web)**: no ministério, botão "Importar do PDF" → sobe o PDF → mostra as músicas detectadas para revisão/edição → confirma e cria; monta a playlist.
- **Riscos**: qualidade da extração varia com o PDF; PDF escaneado (imagem) não tem texto extraível sem OCR. Tratar como sugestão editável, nunca cadastro automático silencioso.
