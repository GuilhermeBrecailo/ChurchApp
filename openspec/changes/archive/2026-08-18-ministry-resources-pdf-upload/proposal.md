## Why

The "Novo recurso" / "Editar recurso" dialog in `web/app/pages/ministery/[id].vue` (`isResourceDialogOpen`) says "Adicione um link, arquivo ou material do ministério" but only has a "Link" text field — there's no file picker, and `handleSaveResource` hard-requires a non-empty `url`. A leader who has a PDF and no place to host it (bulletin, sheet music, form, schedule template) cannot attach it to a ministry's "Recursos" today, even though the exact same capability already exists and works for songs (`songPdfFile` + `uploadDepartmentPdf`) and children's-ministry activities (`activityPdfFile`) on the same page, and `DepartmentResource.metadata.pdf` is already a typed field on the frontend model — the gap is purely that the resource form/save handler never uses it.

## What Changes

- Add a `v-file-input` for PDF to the resource dialog, matching the existing song/activity PDF upload UI exactly (label, `accept="application/pdf"`, show-size, clearable, "PDF anexado" preview-with-remove state).
- Wire it through the existing `uploadPdfFile`/`uploadDepartmentPdf` helper already used by songs and activities — no new backend upload endpoint needed.
- Make the "Link" field effectively optional from the user's perspective when a PDF is attached: if left blank, the form submits the uploaded PDF's URL as `url` (the backend's `createChurchDepartmentResource`/`updateChurchDepartmentResource` already require a non-empty `url` and already accept `pdfUrl` separately — confirmed in `api/src/interfaces/adapters/churchDepartmentAdapters.ts`, which even falls back `pdfUrl: body.pdfUrl || body.url` when no explicit `pdfUrl` is sent; this change adds the mirror-image fallback client-side instead of touching the backend contract).
- Show the PDF (when present) as an "Abrir PDF" action on the resource card in the resources tab, mirroring how songs already surface `song.metadata.pdf.url`.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `ministry-resources`: resource creation/edit gains PDF attachment; the link field becomes optional when a PDF is provided (no existing spec file yet for this capability in `openspec/specs/` — first formal spec despite the base feature having shipped already).

## Impact

- `web/app/pages/ministery/[id].vue` — resource dialog template, `resourceForm` state, `handleSaveResource`, resource card display.
- `web/composables/useDepartments.ts` — `createDepartmentResource`/`updateDepartmentResource` payload types gain the same `pdfUrl`/`pdfKey`/`pdfFileName`/`pdfMimeType`/`pdfSize`/`removePdf` fields songs already send (adapter/backend already accepts these for `MediaItem.metadata.pdf`, confirmed by `DepartmentResource.metadata.pdf` already existing in the frontend type and by the shared `POST /api/church/departments/:id/uploads/pdf` endpoint).
- No new backend routes or DB migrations expected — reusing the existing upload endpoint and `MediaItem.metadata` JSON contract described in `CLAUDE.md`'s Uploads section.
