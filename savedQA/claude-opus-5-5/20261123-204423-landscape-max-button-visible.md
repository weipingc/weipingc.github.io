# Keep the Max button visible on phones in landscape

## Ask

On mobile devices with landscape orientation, when it is in normal lyrics mode, the btn-maximize button is not
displayed, probably due to not enough space; change to display it all the time, consider making progress-bar's size
flexible.

## Answer

**Cause.** `#progress-bar` already had `flex: 1` and `min-width: 40px`, but the range input still reported its own
width (about 129px) as the least it could be. The playback row (`#playback-controls`) is a grid item of the right
pane, and a grid item can't be narrower than its content, so the row was forced wider than the pane. The right pane
hides overflow, so Max, last in the row, was cut off.

Measured at 740×360 (Galaxy S8/S9 in landscape): right pane 460px, playback row 496px, Max at 742–772px (off screen).

**Fix** (`common.css`, the `#progress-bar` rule): `flex: 1 1 0; width: 0;` with `min-width: 40px` kept. The bar now
takes whatever room the six buttons, the time and Max leave, down to 40px, and the row fits the pane. A comment in
the "Smartphone sizes" section that said the right pane was wide enough in landscape was updated.

**Checked in Chrome (device emulation):**

| Viewport | Progress bar | Max |
|---|---|---|
| 720×360 landscape | 73px | 686–716 (visible) |
| 740×360 landscape | 93px | 706–736 (visible) |
| 844×390 landscape | 197px | 810–840 (visible) |
| 390×844 portrait | 378px, own row (as before) | visible |
| 760×700 desktop window | 58px | 708–742 (visible) |
| 1280×800 desktop | 578px | visible |
