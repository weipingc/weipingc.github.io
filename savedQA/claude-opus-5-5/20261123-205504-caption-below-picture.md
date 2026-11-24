# Caption below the picture, no "Click to play" hint

## Ask

Don't display the hint "Click to play", display the picture-caption below the image of a movement.

## Answer

**Changes:**

- `index.html`, `index1.html`: the `#thumbnail-play-hint` element ("▶ Click to play") is removed. The thumbnail
  overlay is now just the picture (`#thumbnail-img`, no longer wrapped in `.thumbnail-panel`) followed by
  `#picture-caption`; the `#thumbnail-labels` wrapper is gone. A click anywhere on the overlay still plays (the
  overlay's click handler in `app.js` is unchanged).
- `common.css`:
  - `#thumbnail-overlay` is a centered column: the picture, then 8px, then the caption.
  - `#thumbnail-img` is the full width of the area with `height: auto`, so its box is exactly as tall as the
    picture and the caption sits right under it. A picture too tall for the area shrinks (flex) to the height the
    caption leaves, with `object-fit: contain` centering it, so the caption is still right under the visible picture.
    Smaller pictures are still scaled up to fill the width or height, as before.
  - Below the picture the caption is plain text (`--text-secondary`, title in italics) with no dark band.
  - Image background mode: the picture fills the whole area (as before), so the caption can't go below it; it stays
    over the picture at the bottom, on its dark band (`#thumbnail-img` is `display: none` there instead of the old
    `.thumbnail-panel { visibility: hidden }`).
- `app.js`: comments for PICTURE BEFORE PLAYBACK and PICTURE CAPTION updated (no code change).
- `README.md`: the Picture, Caption and Image background descriptions updated.

**Checked in Chrome (Messiah II, *The Prophet Isaiah* by Michelangelo):**

| Case | Picture | Caption |
|---|---|---|
| 1280×800 desktop, Graphics | 105–664 (shrunk to fit with the caption) | 672–690 |
| 390×844 phone, small lyrics area | 584–744 | 752–770 |
| 390×844 phone, Songs collapsed (tall area) | 322–582 (centered) | 590–608 |
| 1280×800 desktop, Image mode | fills the area | over it at the bottom, 656–682 |

Clicking the caption (in Image mode) started playback and hid the overlay. `index1.html` loads with no errors and
lays out the same.
