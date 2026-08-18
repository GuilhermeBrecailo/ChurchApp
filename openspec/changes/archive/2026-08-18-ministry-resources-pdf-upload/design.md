## Context

Songs and children's-ministry activities on `ministery/[id].vue` already have working PDF upload, both following the same shape:
1. `v-file-input` bound to a local `File | File[] | null` ref, `accept="application/pdf"`.
2. On save, `uploadPdfFile(fileRef, errorMessage)` (a shared helper wrapping `uploadDepartmentPdf(departmentId, file)`, which POSTs to `/api/church/departments/:id/uploads/pdf`) returns `{ url, key, fileName, mimeType, size }` when a file was selected.
3. Those fields get spread into the create/update payload as `pdfUrl`/`pdfKey`/`pdfFileName`/`pdfMimeType`/`pdfSize`.

`handleSaveResource` and the resource dialog never adopted this pattern — `resourceForm` has no PDF fields, and `url` is a hard-required text field both client-side (`if (!url) { error }`) and server-side (`churchDepartmentAdapters.ts`'s `createChurchDepartmentResource`/`updateChurchDepartmentResource` throw `DomainError` when `body.url` is empty). The backend already accepts `pdfUrl` etc. as separate fields and already has a fallback (`pdfUrl: body.pdfUrl || body.url`) for the reverse case.

## Goals / Non-Goals

**Goals:**
- A leader can attach a PDF to a ministry resource without needing to host it elsewhere first.
- Reuse the exact existing upload plumbing (`uploadPdfFile`, `uploadDepartmentPdf`, `POST /uploads/pdf`) — zero new backend surface.
- Resource can be link-only, PDF-only, or both, without a confusing "Link required" error when the leader only has a PDF.

**Non-Goals:**
- Supporting file types beyond PDF for resources (matches the existing scope of the song/activity upload feature).
- Changing the backend's `url`-required validation — worked around client-side instead, per the Decisions below.

## Decisions

- **Client-side URL fallback, not a backend contract change**: when `resourceForm.url` is blank at submit time but a PDF was uploaded, set the submitted `url` to the uploaded PDF's `url` before calling `createDepartmentResource`/`updateDepartmentResource`. This satisfies the backend's existing non-negotiable `url` requirement without touching `churchDepartmentAdapters.ts`, and mirrors the fallback direction the backend already implements for `pdfUrl`.
  - Alternative considered: relax the backend's `url` requirement to accept `pdfUrl` alone. Rejected for this change — touches a shared, already-covered-by-existing-behavior backend validation path (also used by `updateChurchDepartmentResource`), more risk than needed for what is fundamentally a frontend gap; revisit only if a future resource type needs to exist with neither a link nor a PDF.
- **Copy the exact song-dialog PDF UI** ("PDF anexado" card with a remove action when one exists + `v-file-input` below it) rather than inventing new patterns, for visual/interaction consistency across the three PDF-attachment surfaces (songs, activities, resources) already on this page.
- **Resource card gains an "Abrir PDF" button** identical to the one songs already render (`v-if="song.metadata?.pdf?.url"`), applied to `resource.metadata?.pdf?.url`.

## Risks / Trade-offs

- [Leader removes an existing PDF and also clears the link] → Keep the existing client-side "Link required" validation as a final fallback: if both `url` and any PDF (existing-and-not-removed, or newly uploaded) are absent, block submit with the current error message — never silently send an empty `url` to the backend, which would 500 or throw `DomainError`.

## Open Questions

None — the pattern to copy already exists twice in this exact file.
