## 1. Resource form

- [ ] 1.1 Add `resourcePdfFile` ref + `v-file-input` (PDF) to the resource dialog, matching the song dialog's markup/labels
- [ ] 1.2 Add the "PDF anexado" preview-with-remove card, matching the song dialog, bound to `resourceForm.pdfUrl`
- [ ] 1.3 Add `pdfUrl`/`pdfKey`/`pdfFileName`/`pdfMimeType`/`pdfSize`/`removePdf` fields to `resourceForm`, mirroring `songForm`

## 2. Save flow

- [ ] 2.1 In `handleSaveResource`, call `uploadPdfFile(resourcePdfFile.value, "Não foi possível enviar o PDF do recurso.")` before building the payload
- [ ] 2.2 When `resourceForm.url` is blank and a PDF (existing-and-kept or newly uploaded) is present, use the PDF's URL as the submitted `url`
- [ ] 2.3 Update the "Link required" validation to only block submit when both link and PDF are absent
- [ ] 2.4 Spread `pdfUrl`/`pdfKey`/`pdfFileName`/`pdfMimeType`/`pdfSize`/`removePdf` into the create/update payload, matching `handleSaveSong`'s conditional spread

## 3. Display

- [ ] 3.1 Add "Abrir PDF" button to the resource card in the resources tab when `resource.metadata?.pdf?.url` is present

## 4. Verification

- [ ] 4.1 Manual smoke test: create a resource with only a PDF, no link — succeeds, card shows "Abrir PDF"
- [ ] 4.2 Manual smoke test: create a resource with only a link, no PDF — succeeds as before
- [ ] 4.3 Manual smoke test: create a resource with neither — blocked with a clear message
- [ ] 4.4 Manual smoke test: edit an existing resource to remove its PDF — resource still valid if a link exists, blocked otherwise
- [ ] 4.5 Run `npm run web:build`
