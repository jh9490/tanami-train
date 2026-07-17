# Quickstart: Validate Reference-Matched ATS CV Layout

## Automated Checks

1. Run `npm test -- --runInBand __tests__/cvService.test.ts`
2. Confirm English renderer tests assert:
   - Roboto font use
   - centered identity/contact header
   - dark-blue section headings
   - supported reference-matched section order
   - no multi-column layout

## Manual PDF Validation

1. Open the CV editor and generate an English PDF with representative content in every currently supported section.
2. Compare the PDF side by side with `ATS CV 4.docx`.
3. Verify:
   - name/title centered at the top
   - contact data directly below the identity line
   - compact Roboto body text
   - blue centered section headings
   - one-column reading order
   - education before experiences in the reference-matched English export
   - no clipped or overlapping text
4. Generate a longer English CV and confirm it continues naturally to a second page without columns.
5. Generate an Arabic CV and confirm the existing RTL presentation remains intact.
