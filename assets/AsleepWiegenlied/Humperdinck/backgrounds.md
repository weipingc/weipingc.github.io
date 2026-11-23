# Background pictures

The `Chapter1-bg.jpg` file is the movement's Image background (`background` in `work.js`; see **Background** in the
README). It is a public-domain picture from Wikimedia Commons, saved 1024 × 682 px (3:2); the background is shown
blurred. The source page has the full-size original and its license details.

The painting is in portrait format and only 658 px wide, so it is shown whole, centered on a blurred enlargement of
itself.

| File | Movement text | Picture | License |
|---|---|---|---|
| Chapter1-bg.jpg | Abends, will ich schlafen gehn, vierzehn Engel um mich stehn (fourteen angels watch over the children in the forest) | [Bernhard Plockhorst - Schutzengel.jpg](https://commons.wikimedia.org/wiki/File:Bernhard_Plockhorst_-_Schutzengel.jpg) — Bernhard Plockhorst, *Schutzengel* (Guardian Angel), late 19th century | Public domain |

## Thumbnail

`work.jpg` is the work's thumbnail (`thumbnail` in `work.js`), shown when the work is selected: from Wikimedia Commons,
saved 1280 px wide and not cropped. The composer's portrait, shown when the artist is selected, is `../Humperdinck.jpg` (`thumbnail` in `../artist.js`), saved 960 px wide.

| File | Picture | License |
|---|---|---|
| work.jpg | [Engelbert Humperdinck Hänsel und Gretel Otto Böhler.jpg](https://commons.wikimedia.org/wiki/File:Engelbert_Humperdinck_H%C3%A4nsel_und_Gretel_Otto_B%C3%B6hler.jpg) — Otto Böhler, silhouette of Humperdinck dancing with Hänsel, Gretel and the witch ("Dr. Otto Böhler's Schattenbilder" No. 6, created before 1900) | Public domain |
| ../Humperdinck.jpg | [Portret van de Duitse componist en dirigent Engelbert Humperdinck (1854-1921), SFA022001591.jpg](https://commons.wikimedia.org/wiki/File:Portret_van_de_Duitse_componist_en_dirigent_Engelbert_Humperdinck_(1854-1921),_SFA022001591.jpg) — photograph, 1912, photographer not known | Public domain |

## Audio

The audio, `Chapter1.mp3`, is a 78 rpm transfer from the Internet Archive (see `description` in `work.js`),
prepared from its FLAC: mixed to mono at 44.1 kHz; rumble below 60 Hz filtered out; clicks and crackle removed
with ffmpeg's `adeclick`; low-passed at 6.5 kHz (24 dB per octave), above what the recording holds; a fixed gain and
a limiter for the remaining clicks. The hiss was then reduced by up to 18 dB with
[scripts/denoise-audio-v2](../../../scripts/denoise-audio-v2/README.md) (`clean()`, without whine removal), which
keeps the exact length, so the timing stays valid. Loudness about −18 LUFS.
