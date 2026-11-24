# Shorter labels in the View Options panel

## Ask

Change the label of background-toggle to BG, the two labels of lyrics-shown-label from Original to Orig, Translation
to Transltn to save space.

## Answer

**Label changes** (in both `index.html` and `index1.html`, which share the View Options markup):

- `#background-toggle-label`: `Background:` → `BG:`. The colon is kept to match the other row labels (`Show:`,
  `Font:`, `Lyrics:`).
- The `#lyrics-shown` check boxes: `Original` → `Orig`, `Translation` → `Transltn`.
- Each shortened label has a `title` with the full word (`Background`, `Original`, `Translation`), shown on hover.
- `README.md`: the layout diagram and the descriptions that quote these labels now use the short forms.

**A bug found along the way, and fixed:** `index1.html` (the silent page) has no Sync buttons, but it loads the same
`app.js`, which attached a click handler to `btn-sync` with no null check. On `index1.html` this threw
`TypeError: Cannot read properties of null (reading 'addEventListener')` at app.js line 2121, so the rest of
`app.js` never ran there: progress bar seeking, Prev / Next and the code after it. The problem started when
`btn-sync` was added (5ddca51). The fix is `document.getElementById(id)?.addEventListener(...)`, so a page without
the buttons skips them. After the fix `index1.html` loads with no errors, and the code after that line runs again
(for example, it adds `highlight-mode=auto` to the URL).

Checked in Chrome at 740×360 (phone landscape): the View Options rows read `Show: ☑ Orig ☑ Transltn` and
`BG: None | Graphics | Image`.
