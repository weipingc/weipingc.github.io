# Background pictures

The `Chapter1-bg.jpg` file is the movement's Image background (`background` in `work.js`; see **Background** in the
README). It is a public-domain picture from Wikimedia Commons, saved 1024 × 682 px (3:2); the background is shown
blurred. The source page has the full-size original and its license details.

| File | Movement text | Picture | License |
|---|---|---|---|
| Chapter1-bg.jpg | Dans un sommeil que charmait ton image … Hélas, triste réveil des songes (a dream of flying towards the light, then the waking) | [Le Reve-Puvis de Chavannes-Orsay.jpg](https://commons.wikimedia.org/wiki/File:Le_Reve-Puvis_de_Chavannes-Orsay.jpg) — Pierre Puvis de Chavannes, *Le Rêve* (The Dream), 1883, Musée d'Orsay: a sleeper under a crescent moon visited by dream figures | Public domain |

## Thumbnail

`work.jpg` is the work's thumbnail (`thumbnail` in `work.js`), shown when the work is selected: from Wikimedia Commons,
saved 1280 px wide and not cropped. The composer's portrait, shown when the artist is selected, is `../Faure.jpg` (`thumbnail` in `../artist.js`), saved 960 px wide.

| File | Picture | License |
|---|---|---|
| work.jpg | ["Après un rêve. Mélodie. Musique de Gabriel Fauré", pour 1 voix et piano, sur un texte anonyme italien trad. par Romain Bussine - btv1b10860393x (2 of 6).jpg](https://commons.wikimedia.org/wiki/File:%22Apr%C3%A8s_un_r%C3%AAve._M%C3%A9lodie._Musique_de_Gabriel_Faur%C3%A9%22,_pour_1_voix_et_piano,_sur_un_texte_anonyme_italien_trad._par_Romain_Bussine_-_btv1b10860393x_(2_of_6).jpg) — title page of a manuscript copy with French and Italian text (c. 1879), Bibliothèque nationale de France | Public domain |
| ../Faure.jpg | [John Singer Sargent - Gabriel Fauré.jpg](https://commons.wikimedia.org/wiki/File:John_Singer_Sargent_-_Gabriel_Faur%C3%A9.jpg) — John Singer Sargent, c. 1889 | Public domain |

## Audio

The audio, `Chapter1.mp3`, is a 78 rpm transfer from the Internet Archive (see `description` in `work.js`),
prepared from its FLAC: mixed to mono at 44.1 kHz; rumble below 60 Hz filtered out; clicks and crackle removed
with ffmpeg's `adeclick`; low-passed at 10 kHz (24 dB per octave), above what the recording holds; a fixed gain and
a limiter for the remaining clicks. The hiss was then reduced by up to 18 dB with
[scripts/denoise-audio-v2](../../../scripts/denoise-audio-v2/README.md) (`clean()`, without whine removal), which
keeps the exact length, so the timing stays valid. Loudness about −18 LUFS.
