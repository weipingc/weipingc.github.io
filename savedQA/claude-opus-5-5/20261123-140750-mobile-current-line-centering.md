# Keep the current lyrics line centered on mobile

## Ask

On mobile devices, sometime the lyrics line that is currently being played is not displayed at the center or not
visible

## Answer

The lyrics were centered only when the highlight moved to another line. Anything that changed the layout between
two lines left the current line where the scroll position happened to put it, until the next line started. On a
phone this happens often, because the Songs tree and View Options sit above the lyrics in the same column.

Reproduced in headless Chrome at 390×844 (phone emulation), measuring the current line's distance from the
middle of the lyrics panel:

| Action                                   | Before                    | After |
|------------------------------------------|---------------------------|-------|
| Collapse the Songs tree                  | 198px above center        | 0px   |
| Reopen the Songs tree (line 20)          | 198px below, **not visible** | 0px |
| Open View Options                        | 36px off                  | 0px   |
| A+ ×5                                    | 49px off                  | 0px   |
| Rotate to landscape                      | 10–208px off (not visible) | 0px  |
| Max / restore, desktop size              | (re-centered after 350ms) | 0px   |

### Changes

[app.js](../../app.js):

- `centerCurrentLine(smooth = true)`: can now scroll at once (`behavior: 'instant'`; `'auto'` would follow the CSS
  `scroll-behavior: smooth`).
- New section **KEEP THE CURRENT LINE CENTERED**: a `ResizeObserver` on `#lyrics-container` (panel size: tree,
  View Options, rotation, Max, browser toolbars) and `#lyrics-inner` (content size: A+ / A−, Show, bilingual divider
  drag) re-centers the current line at once, at most once a frame, so it stays pinned even through the 0.3s
  font-size transition. It also re-centers when the page becomes visible again (phone unlocked, back from another
  app), since smooth scrolling may not run while the page is hidden.
- Removed the now-redundant re-centering in `setLyricsMaximized` (`setTimeout(centerCurrentLine, 350)`) and in the
  bilingual divider's `lostpointercapture` / `dblclick` handlers.

[common.css](../../common.css):

- `#app` height `100vh` → `100dvh` (with `100vh` as fallback), matching `body`. On a phone, `100vh` is the height
  with the browser toolbars hidden, so with them shown the bottom of the app sat under the toolbar and the lyrics
  were centered lower than their visible middle.

Normal line-to-line scrolling is unchanged (smooth); verified with auto-mode playback.

### Not changed

The first and last few lines of a movement still can't reach the center: the spacers above and below the lyrics
are only 40px, so the panel can't scroll further. This is by design and the same on desktop.

---

## Ask

When the song is paused, then play agian, make sure the line being play is displayed at center

## Answer

On Play the highlight usually stays on the same line, and the lyrics were centered only when the highlight moved to
another line. So if the lyrics had been scrolled during the pause, the line being played stayed off-center (often
out of sight) until the next line began.

[app.js](../../app.js), the audio `play` listener (AUDIO EVENTS) now calls `centerCurrentLine()`, a smooth scroll
back to the highlighted line: in auto mode the line being played, in manual mode the operator's line. (A seek while
paused already moves the highlight, so the highlight is up to date when playing starts.)

Verified in headless Chrome at phone size:

| Case                                                        | Before Play          | After Play                    |
|-------------------------------------------------------------|----------------------|-------------------------------|
| Auto mode, paused, lyrics scrolled to the end (same line)   | 2550px off, hidden   | 0px (smooth, settled ≈0.8s)   |
| Manual mode, line 6, scrolled to the top                    | 158px off, hidden    | 0px                           |

---

## Ask

When the last line of a movement is being played, make sure the wrapped part is also visible

## Answer

Every line is centered except the last few: the space under the lyrics (the last `.lyrics-spacer`) was only 40px, so
the panel couldn't scroll further, and the last line sat at the panel's bottom edge. In headless Chrome the wrapped
part was still just inside (41px above the edge), but on a phone the bottom of the panel can be covered, e.g. by the
browser's toolbar over the bottom of the screen (Max mode, where nothing is under the lyrics) or by the manual-mode
hint, and that is where the wrapped part goes.

[common.css](../../common.css):

- `#lyrics-container` gets `container-type: size`, so its height can be used as `cqh`.
- `.lyrics-spacer:last-child { min-height: 50cqh; }`: half the panel under the lyrics, so the last lines are
  centered like every other line, wrapped part and all.

Verified in headless Chrome, last line highlighted, movements whose last line wraps:

| Layout          | Panel  | Last line             | Room under it (before → after) |
|-----------------|--------|-----------------------|--------------------------------|
| Phone           | 199px  | centered (0px off)    | 41px → 78px                    |
| Phone, Max      | 799px  | centered              | → 359–383px                    |
| Desktop         | 608px  | centered              | → 265–283px                    |

Side effect: when a movement's lyrics are shorter than the panel (on a phone almost never; on a large desktop
screen, Max, 13 of the 40 movements), they are no longer centered as a block: they end at the middle of the panel,
so they sit higher (Messiah 1, the shortest, about 90px at 1920×1080).
