# Work titles in the now-playing header, except on a phone in portrait

## Ask

> Display the work title and titleTranslation except on mobile device portrait orientation

## Answer

The now-playing header (between ◀ Prev and Next ▶) used to drop the work titles ("Messiah", "弥赛亚") and cut each
movement title to 20 characters on **every** mobile device and in any window 700 px wide or narrower, whatever the
orientation. Now this compact mode applies only in **portrait**:

| Where | Work titles | Movement titles |
|---|---|---|
| Computer, wide window | shown | full |
| Phone / tablet, portrait (or a window ≤ 700 px wide, taller than wide) | hidden | first 20 characters |
| Phone / tablet, landscape (or a window ≤ 700 px wide, wider than tall) | **shown** | full; "…" where they don't fit |

Turning the device updates the header right away (the media query's `change` listener was already there).

### Changes

- `app.js`: `compactNowPlaying` media query changed from
  `(max-width: 700px), (pointer: coarse) and (hover: none)` to
  `(max-width: 700px) and (orientation: portrait), (pointer: coarse) and (hover: none) and (orientation: portrait)`;
  comments updated.
- `common.css`: comment on the mobile now-playing layout rule updated (the layout rule itself is unchanged: it still
  places the original titles after Prev and the translations before Next, with ellipsis, in both orientations).
- `README.md`: the Now playing entry describes the portrait / landscape behavior.

### Verified (headless Chrome, device emulation)

- Messiah, Overture: portrait 390×844 → `I. Overture` / `I. 序曲`; landscape 844×390 and 667×375 →
  `Messiah  I. Overture … 弥赛亚  I. 序曲`; turning portrait → landscape without reloading switches to the full titles.
- Mozart Requiem, I (longest titles): landscape 844×390 shows `Requiem  I. Introitus, Kyrie,…  安魂曲  I. 进台经、垂怜经、…`,
  cut with an ellipsis, no overflow; 667×375 (single-column phone layout) shows all of it.
- Desktop 1280×800 unchanged; a 600×900 desktop window stays compact.
