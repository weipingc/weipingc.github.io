# Background pictures

The `Chapter1-bg.jpg` file is the movement's Image background (`background` in `work.js`; see **Background** in the
README). It is a public-domain picture from Wikimedia Commons, saved 1024 × 682 px (3:2); the background is shown
blurred. The source page has the full-size original and its license details.

| File | Movement text | Picture | License |
|---|---|---|---|
| Chapter1-bg.jpg | Měsíčku na nebi hlubokém (the water nymph sings to the moon by the lake at night) | [Iwan Nikolajewitsch Kramskoj 002.jpg](https://commons.wikimedia.org/wiki/File:Iwan_Nikolajewitsch_Kramskoj_002.jpg) — Ivan Kramskoi, *The Mermaids* (Русалки, rusalki in the moonlight), 1871, Tretyakov Gallery | Public domain |

## Thumbnail

`work.jpg` is the work's thumbnail (`thumbnail` in `work.js`), shown when the work is selected: from Wikimedia Commons,
saved 1280 px wide and not cropped. The composer's portrait, shown when the artist is selected, is `../Dvorak.jpg` (`thumbnail` in `../artist.js`), saved 960 px wide.

| File | Picture | License |
|---|---|---|
| work.jpg | [Poster for the premiere of Rusalka in Prague, 31 March, 1901..jpg](https://commons.wikimedia.org/wiki/File:Poster_for_the_premiere_of_Rusalka_in_Prague,_31_March,_1901..jpg) — poster of the premiere, National Theatre, Prague, 31 March 1901 | Public domain |
| ../Dvorak.jpg | [Dvorak.jpg](https://commons.wikimedia.org/wiki/File:Dvorak.jpg) — photograph, 1882, photographer not known | Public domain |

## Audio

The audio, `Chapter1.mp3`, is a 78 rpm transfer from the Internet Archive (see `description` in `work.js`),
prepared from its FLAC: mixed to mono at 44.1 kHz; rumble below 60 Hz filtered out; clicks and crackle removed
with ffmpeg's `adeclick`; low-passed at 10 kHz (24 dB per octave), above what the recording holds; a fixed gain and
a limiter for the remaining clicks. The hiss was then reduced by up to 18 dB with
[scripts/denoise-audio-v2](../../../scripts/denoise-audio-v2/README.md) (`clean()`, without whine removal), which
keeps the exact length, so the timing stays valid. Loudness about −18 LUFS.
