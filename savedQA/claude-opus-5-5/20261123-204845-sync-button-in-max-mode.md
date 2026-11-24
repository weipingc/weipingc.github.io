# Show the Sync button in max lyrics mode

## Ask

Display the btn-sync button in max lyrics mode.

## Answer

In max lyrics mode the playback controls are hidden, `btn-sync` included. The top bar already had its own Play /
Pause (`btn-play-pause-max`) and Restore (`btn-restore`) buttons for this mode, so Sync follows the same pattern.

**Changes:**

- `index.html`: a new `btn-sync-max` in `#song-nav`, between `btn-play-pause-max` and `btn-restore` (the same order
  as in the playback controls: play, then Sync, then Max). It has the same crosshair icon and is `hidden` by default.
- `common.css`: `#btn-sync-max` is excluded from the rule that hides the top bar's other children in max mode, and
  is shown with Play / Pause and Restore. Its icon shares the `#btn-sync svg` styles.
- `app.js`: one click handler (`centerCurrentLine()`) now covers both `btn-sync` and `btn-sync-max`. The comment at
  the top of the MAXIMIZE LYRICS PANEL section now mentions the top bar's buttons.

**Checked in Chrome (device emulation), max mode:**

| Viewport | Play / Pause | Sync | Restore |
|---|---|---|---|
| 1280×800 desktop | 1104–1148 | 1160–1206 | 1218–1262 |
| 740×360 phone landscape | 576–620 | 626–672 | 678–722 |
| 360×740 phone portrait | 222–266 | 272–310 | 316–352 |

On 360px portrait both titles still fit to the left of the buttons. With Messiah II loaded and maximized, scrolling
the lyrics 525px and then clicking the new Sync button scrolled them back to the highlighted line (scrollTop 0).
