# Collapsible info pane

## Ask

Make info-pane collapsible

## Answer

The info pane at the bottom of the right pane now collapses to an **INFO** title bar and opens again, the same way the
SONGS and LYRICS TIMING panels do.

- **index.html, index1.html**: the pane has an `#info-header` (an `INFO` title and the arrow button
  `#btn-info-toggle`) and an `#info-body` that wraps the existing `#info-left` and `#info-description`.
- **common.css**:
  - The right pane's last grid row is now `auto`, and `#info-pane` is `height: 100px` while open, so a collapsed
    pane shrinks to its title bar and the lyrics get the space.
  - While the pane is open the arrow sits alone at the top right, and the `INFO` title is hidden. While it is
    collapsed the bar shows `INFO` on the left and the arrow on the right.
  - The arrow uses the LYRICS TIMING convention for a panel docked at the bottom: it points up while collapsed and
    down while open.
  - `#info-body` scrolls now, instead of the whole pane, so the arrow doesn't scroll out of view.
  - The phone layout keeps its 64px cap while open.
- **app.js**: `setInfoPaneOpen(open)` toggles the `collapsed` class, `aria-expanded` and the button title, and writes
  the `info` URL parameter (`open` | `collapsed`, default `open`). It is documented in VIEW OPTIONS IN URL. The lyrics
  re-center through the existing ResizeObserver on `#lyrics-container`.
- **README.md**: the info pane bullet and the layout diagram show the arrow.

Verified in headless Chrome on a 1280×800 desktop, a 390×844 phone and an 844×390 phone in landscape:

- Desktop: the pane is 100px open and 35px collapsed, and the lyrics area grows by the difference.
- Phone: the pane is 64px open and 35px collapsed.
- `?info=collapsed` starts collapsed.
- Maximized mode still hides the pane.
- index1.html works.
- There were no console errors.

Note: an issue that was already there before this change. On a phone the description can't wrap the long
archive.org URL in Messiah's description, so the pane scrolls sideways. `min-width: 0` and `overflow-wrap: anywhere`
on `#info-description` would fix it.

## Ask

On mobile devices, when the orientation is landscape, collapse info-pane

## Answer

On a mobile device in landscape, the info pane now collapses by itself, both when the page loads and when the device
is turned. "Mobile device" uses the app's existing test, `(pointer: coarse) and (hover: none)`: phones and tablets,
not a desktop window that is wide and short. The arrow still opens the pane in landscape.

- **app.js**:
  - `mobileLandscape = matchMedia('(orientation: landscape) and (pointer: coarse) and (hover: none)')`.
  - On load, if it matches, the pane collapses. On a `change` event the pane collapses in landscape, and in
    portrait it takes the state the `info` URL parameter says.
  - `setInfoPaneOpen(open, keepUrl)` has a new `keepUrl` flag. The automatic collapse leaves the URL alone, so `info`
    keeps the last choice made with the arrow. That choice is what portrait restores, and what a shared link opens
    with on other devices.
  - The VIEW OPTIONS IN URL comment for `info` mentions this.
- **README.md**: the info pane bullet describes the landscape behavior.

Verified in headless Chrome with touch emulation and no console errors:

| Case | Result |
|---|---|
| Phone loaded in portrait | Open |
| Rotated to landscape | Collapsed, URL still `info=open` |
| Arrow tapped in landscape | Opens; tapped again, collapses and the URL becomes `collapsed` |
| Rotated back to portrait | Collapsed, the last choice |
| Loaded in landscape with `?info=open` | Collapsed; rotated to portrait, open |
| Tablet (1024×768) in landscape | Collapsed |
| Desktop window, including a short wide one (844×390, no touch) | Not affected |
