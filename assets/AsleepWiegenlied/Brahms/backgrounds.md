# Background pictures

The `Chapter1-bg.jpg` file is the movement's Image background (`background` in `work.js`; see **Background** in the
README). It is a public-domain picture from Wikimedia Commons, saved 1024 × 682 px (3:2); the background is shown
blurred. The source page has the full-size original and its license details.

The picture is a portrait-format woodcut, so it is shown whole, centered on a blurred enlargement of itself.

| File | Movement text | Picture | License |
|---|---|---|---|
| Chapter1-bg.jpg | von Englein bewacht, die zeigen im Traum dir Christkindleins Baum (watched by angels, who show you the Christmas tree in a dream) | [Deutscher Jugendkalender Illustrationen von L. Richter Hoff-Budde-Nr. 1456.jpg](https://commons.wikimedia.org/wiki/File:Deutscher_Jugendkalender_Illustrationen_von_L._Richter_Hoff-Budde-Nr._1456.jpg) — Ludwig Richter, *Wiegenlied im Winter* (a mother and her child in a hut, an angel above with a Christmas tree), Deutscher Jugendkalender, 1848 | Public domain |

## Thumbnail

`work.jpg` is the work's thumbnail (`thumbnail` in `work.js`), shown when the work is selected: from Wikimedia Commons,
saved 1280 px wide and not cropped. The composer's portrait, shown when the artist is selected, is `../Brahms.jpg` (`thumbnail` in `../artist.js`), saved 960 px wide.

| File | Picture | License |
|---|---|---|
| work.jpg | [Guten Abend, gut Nacht (Brahms).jpg](https://commons.wikimedia.org/wiki/File:Guten_Abend,_gut_Nacht_(Brahms).jpg) — the song as printed in a German songbook (after 1897): "1. Strophe uraltes Volkslied, 2. Strophe von Georg Scherer 1849 hinzugesetzt" | Public domain |
| ../Brahms.jpg | [JohannesBrahms.jpg](https://commons.wikimedia.org/wiki/File:JohannesBrahms.jpg) — photograph by C. Brasch, Berlin, 1889 | Public domain |

## Audio

The audio, `Chapter1.mp3`, is a 78 rpm transfer from the Internet Archive (see `description` in `work.js`),
prepared from its FLAC: mixed to mono at 44.1 kHz; rumble below 60 Hz filtered out; clicks and crackle removed
with ffmpeg's `adeclick`; low-passed at 6.5 kHz (24 dB per octave), above what the recording holds; a fixed gain and
a limiter for the remaining clicks. The hiss was then reduced by up to 18 dB with
[scripts/denoise-audio-v2](../../../scripts/denoise-audio-v2/README.md) (`clean()`, without whine removal), which
keeps the exact length, so the timing stays valid. Loudness about −18 LUFS.
