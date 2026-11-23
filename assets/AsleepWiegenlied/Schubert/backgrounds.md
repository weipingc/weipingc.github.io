# Background pictures

The `Chapter1-bg.jpg` file is the movement's Image background (`background` in `work.js`; see **Background** in the
README). It is a public-domain picture from Wikimedia Commons, saved 1024 × 682 px (3:2); the background is shown
blurred. The source page has the full-size original and its license details.

| File | Movement text | Picture | License |
|---|---|---|---|
| Chapter1-bg.jpg | Schlafe, schlafe … leise wiegt dich deiner Mutter Hand (sleep, your mother's hand gently rocks you) | [Berthe Morisot - The Cradle - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Berthe_Morisot_-_The_Cradle_-_Google_Art_Project.jpg) — Berthe Morisot, *Le Berceau* (The Cradle), 1872, Musée d'Orsay; cropped to the mother and the cradle | Public domain |

## Thumbnail

`work.jpg` is the work's thumbnail (`thumbnail` in `work.js`), shown when the work is selected: from Wikimedia Commons,
saved 1280 px wide and not cropped. The composer's portrait, shown when the artist is selected, is `../Schubert.jpg` (`thumbnail` in `../artist.js`), saved 960 px wide.

| File | Picture | License |
|---|---|---|
| work.jpg | [Berthe Morisot - The Cradle - Google Art Project.jpg](https://commons.wikimedia.org/wiki/File:Berthe_Morisot_-_The_Cradle_-_Google_Art_Project.jpg) — the whole painting | Public domain |
| ../Schubert.jpg | [Franz Schubert by Wilhelm August Rieder 1875.jpg](https://commons.wikimedia.org/wiki/File:Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg) — Wilhelm August Rieder, 1875 (after his watercolour of 1825) | Public domain |

## Audio

The audio, `Chapter1.mp3`, is a 78 rpm transfer from the Internet Archive (see `description` in `work.js`),
prepared from its FLAC: mixed to mono at 44.1 kHz; rumble below 60 Hz filtered out; clicks and crackle removed
with ffmpeg's `adeclick`; low-passed at 6.5 kHz (24 dB per octave), above what the recording holds; a fixed gain and
a limiter for the remaining clicks. The hiss was then reduced by up to 18 dB with
[scripts/denoise-audio-v2](../../../scripts/denoise-audio-v2/README.md) (`clean()`, without whine removal), which
keeps the exact length, so the timing stays valid. Loudness about −18 LUFS.
