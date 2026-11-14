# EGIZ — THE SAME GROUND · Scene bible and generation prompts

> AI-assisted; human review pending. Read [ART_DIRECTION.md](ART_DIRECTION.md) first.
> All footage is illustrative. The landing page labels it, and nothing here depicts a real mission,
> crew, agency or result.

## How to produce a scene (the pipeline)

1. **Stills first.** In your image generator (e.g. Nano Banana in Flow), generate the **START** frame
   and, where listed, the **END** frame from the image prompts below. Use 16:9, at least 1920×1080.
   Pick the best of several; consistency matters more than spectacle.
2. **Video.** In Google Flow, model **Gemini Omni Flash 1.2**, 16:9, 10 s. Use *Frames to video*
   with START (and END) as ingredients, and paste the **VIDEO PROMPT**. Test at 360p, finalise at 720p.
   One output per attempt until the prompt is validated.
3. **Export** the MP4 and run the encode commands at the end of this file.
4. **Drop the files** at the exact paths listed. The page finds them on its own (it probes each path
   on load), so no code changes are needed. A still alone already shows; the video replaces it once
   present.

Each START still doubles as the poster the page shows while the video loads, so it must be a frame you
would be proud of on its own.

Global negative, appended to every video and image prompt:

```
no text, no captions, no logos, no flags, no mission patches, no UI, no HUD, no holograms, no neon,
no lens flare streaks, no glowing particles, no camera shake, no fisheye distortion, no oversharpening,
no noisy or pixelated terrain, no plastic CG look, no cartoon, no morphing geometry, no flicker,
no recognisable real person, no real rover model, no watermark
```

---

## EGZ-01 · FIRST LIGHT
- **Role:** Hero opening film (chapter 0). Plays once on arrival, then dissolves into the live
  measured lunar world with matching framing. Establishes scale and the grazing-light law.
- **Concept:** Dawn arrives at the lunar south pole the way it does there: sideways. A line of sunlight
  crawls across a highland plateau, and every crater rim lights up one after another like a fuse burning
  toward the camera. A thin blue Earth hangs low on the horizon.
- **Subject / environment:** Cratered south-polar highlands, a broad flat-topped massif in mid-ground,
  hundreds of craters from 5 m to 3 km, fresh bright-rimmed ones among softened old ones.
- **Camera:** 600 m above the surface, 6 km from the massif, looking slightly down (−8°) toward the Sun
  side.
- **Movement:** Very slow forward glide (≈ 15 m/s) with a 2° descent; no rotation.
- **Lens / composition:** 35 mm. Horizon on the upper quarter, Earth crescent at upper right third,
  massif centre-right. The left half stays darker (copy column).
- **Lighting:** Sun 1.5° above the horizon at frame right/behind the massif, hard and white. Terminator
  sweeps right→left across the frame during the clip.
- **Grade:** Neutral warm-grey regolith, true black sky, cool earthshine in the shadows.
- **Atmosphere:** None. Perfect clarity to the horizon.
- **Materials:** Fine grey regolith, sharp-rimmed fresh craters with bright ejecta rays, subdued old
  craters, scattered metre-scale boulders casting long needle shadows.
- **Motion:** Light advancing across the ground; shadows retreating into crater floors; camera glide.
- **Frames:** START = most of the plateau in shadow, only the massif summit and far rims lit. END =
  sunlight reaches the foreground craters, long shadows still pointing toward the camera.
- **Loop:** No (plays once, then hands off).
- **Files:** `web/public/media/cinematic/hero/egz01-first-light.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Photorealistic lunar south pole highlands seen from 600 metres altitude at the moment of sunrise,
a broad flat-topped mountain in the middle distance on the right, its summit just catching hard white
sunlight while the cratered plain in front is still in deep shadow. The Sun is a tiny blinding point
at the horizon behind the mountain. Pitch-black sky. A thin crescent of a blue Earth sits low above the
horizon in the upper right. Hundreds of impact craters of every size, sharp fresh rims with bright
ejecta, older softened craters, scattered boulders. No atmosphere, perfect clarity to the horizon.
35 mm lens, horizon on the upper quarter, left half of the frame darker. Fine film grain, natural
grey regolith tones, cinematic documentary realism, 16:9.
```

**IMAGE PROMPT · END**
```
Same viewpoint and composition as the previous frame, slightly closer to the ground: low sunlight
now rakes across the whole cratered plain from the right, every crater rim lit on its sunward side and
filled with long black shadow on the other, boulders casting needle-thin shadows 50 metres long toward
the camera, the flat-topped mountain fully lit. Black sky, thin blue Earth crescent on the horizon.
Photorealistic, natural warm-grey regolith, 35 mm, fine film grain, 16:9.
```

**VIDEO PROMPT**
```
A slow, steady forward glide 600 metres above the lunar south pole highlands at sunrise. Sunlight
arrives sideways: a sharp terminator line crawls across the cratered plain from right to left,
lighting crater rims one after another like a fuse, while long black shadows shrink back into the
crater floors. A flat-topped mountain on the right is lit first. The Sun is a hard white point on the
horizon; the sky stays pitch black; a thin blue Earth crescent hangs low in the upper right and does
not move. No air: perfectly sharp to the horizon. The camera never rotates, only drifts forward and
slightly down. Photoreal documentary cinematography, 35 mm, natural grey regolith, deep shadows that
keep faint detail, fine film grain.
```
- **Ingredients:** START and END stills. Optional style references: `web/public/hero/moon-south-pole-2560.jpg`,
  `web/public/hero/mons-mouton-hillshade-1600.jpg` (measured relief of the real site).

---

## EGZ-02 · THE TWIN
- **Role:** Chapter 1 opening plate, the first twin cut. Same composition as EGZ-01's end frame, but on
  Earth. Hands off to the live probe ("press and hold to cut through to the Moon").
- **Concept:** For one second you think you are still on the Moon. Then a sky appears. Two figures in
  pale field suits walk across a salt pan toward a dark range at dusk, rehearsing.
- **Subject / environment:** A desert salt flat (white polygonal crust) with a dark alluvial fan and
  a banded mountain range behind; the scale of Death Valley.
- **Camera:** 4 m above the ground, 30 m behind two walking figures, looking toward the range.
- **Movement:** Slow push-in following the walkers at their pace; slight rise (crane up 2 m).
- **Lens / composition:** 35 mm, horizon on the upper third (matching EGZ-01), figures small in the
  right third.
- **Lighting:** Sun 6° above the horizon behind the camera-left, long figure shadows across the salt
  toward frame right. Warm low light on the range.
- **Grade:** Salt cool white, range warm ochre, deep-blue sky fading to pale gold at the horizon.
- **Atmosphere:** Clear desert air, faint blue haze on the farthest ridges.
- **Materials:** Salt crust polygons with raised ridges, wind-polished; dark gravel fan; striped
  sedimentary range.
- **Motion:** Two people walking deliberately, one carrying a sample case; long shadows stretch.
- **Frames:** START = salt plain composition that mirrors EGZ-01's END (craters ≈ salt polygons).
  END = figures closer to the range, sky glowing.
- **Loop:** No.
- **Files:** `web/public/media/cinematic/earth/egz02-the-twin.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Photorealistic wide view across a vast white desert salt flat at dusk, the ground covered in raised
polygonal salt crust that from a distance resembles a cratered plain, a dark gravel alluvial fan and a
banded ochre and brown mountain range on the horizon. Low warm sunlight from behind the camera-left,
long shadows. Two small figures in pale grey field suits with backpacks walking away from the camera
toward the range, small in the right third of the frame. Deep blue sky fading to pale gold at the
horizon. 35 mm lens, camera 4 metres high, horizon on the upper third. Fine film grain, documentary
realism, 16:9.
```

**VIDEO PROMPT**
```
A slow push-in behind two small figures in pale grey field suits walking across a vast white salt
flat at dusk toward a dark banded mountain range. The polygonal salt crust looks like a cratered
plain until the camera rises gently and reveals a deep blue sky glowing gold at the horizon. Long
shadows of the walkers stretch across the salt. One carries a sample case. Steady, heavy camera, no
shake; walking pace. Photoreal documentary cinematography, 35 mm, warm low light on the mountains,
cool white salt, fine film grain.
```
- **Ingredients:** START still; style reference EGZ-01 END still (to match framing).

---

## EGZ-03 · SHADOW TIDE
- **Role:** Chapter 2 (Moon, measured) opening plate. Quiet and mysterious; hands off to the live
  plateau where the visitor drags the Sun.
- **Concept:** A time-lapse of a lunar day at the pole: the Sun never rises, it circles the horizon,
  and shadows of crater rims swing around like the hands of a vast clock. One crater floor never
  receives light at all.
- **Subject / environment:** A deep crater with a permanently shadowed floor, rim in the foreground,
  plateau beyond.
- **Camera:** Locked off on a rim, 20 m high, looking across the crater.
- **Movement:** None (time-lapse). The light moves.
- **Lens / composition:** 24 mm, crater interior fills the lower two-thirds, black sky above.
- **Lighting:** Sun at 1–3° elevation, moving left→right along the horizon during the clip.
- **Grade:** Neutral grey; the shadowed floor is pure deep blue-black with a faint earthshine lift.
- **Atmosphere:** None.
- **Materials:** Terraced crater walls, talus, boulders; a perfectly dark floor.
- **Motion:** Shadows rotating across the scene, light sliding along the rim; nothing else moves.
- **Frames:** START = shadows pointing right. END = shadows swung to pointing left.
- **Loop:** Yes, a seamless loop (END ≈ START mirrored). Use as `loop: true`.
- **Files:** `web/public/media/cinematic/moon/egz03-shadow-tide.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Photorealistic view from the rim of a deep lunar crater near the south pole, looking across the
crater: terraced inner walls, talus slopes and boulders, the crater floor completely black in
permanent shadow. The Sun skims the horizon at the far left, only 2 degrees high, and every ridge casts
a shadow kilometres long toward the right. Pitch-black sky. 24 mm lens, crater fills the lower two
thirds. Natural neutral-grey regolith, deep shadows with faint detail, fine film grain, 16:9.
```

**IMAGE PROMPT · END**
```
Same locked-off viewpoint over the deep lunar crater; the Sun now skims the horizon at the far right,
2 degrees high, and every shadow points to the left. The crater floor is still completely black.
Photorealistic, neutral grey regolith, black sky, 24 mm, fine film grain, 16:9.
```

**VIDEO PROMPT**
```
Locked-off time-lapse from the rim of a deep crater at the lunar south pole. The Sun never rises: it
slides along the horizon from left to right, a hard white point just above the edge of the world, and
the long shadows of every ridge and boulder swing slowly across the terrain like the hands of a giant
clock. The crater floor stays completely dark the whole time. Black sky, no air, nothing else moves.
Calm, mysterious, photoreal, 24 mm, neutral grey, fine film grain.
```
- **Ingredients:** START and END stills; reference `web/public/hero/mons-mouton-hillshade-1600.jpg`.

---

## EGZ-04 · THE BOOTPRINT
- **Role:** Chapter 5 (Limits) opening plate. An intimate macro that explains a limit in one image:
  on the Moon nothing disturbs a footprint; dust does not hang in vacuum. Hands off to the live
  fissure ledger.
- **Concept:** A boot presses into lunar regolith in extreme close-up. Grains flow, slip and fall
  instantly; no cloud, no drift. When the boot lifts, the print is razor sharp and will stay for a
  million years.
- **Subject / environment:** Lunar regolith surface, a ribbed boot sole (generic, unbranded).
- **Camera:** 30 cm above the ground, 45° down.
- **Movement:** Static, then a very slow 5 cm push as the boot lifts.
- **Lens / composition:** 100 mm macro, print centred slightly right.
- **Lighting:** Hard sunlight at 8°, from frame left; deep crisp shadows inside the tread.
- **Grade:** Neutral warm grey; blacks with detail.
- **Atmosphere:** Vacuum: grains follow perfect parabolas and fall at once.
- **Materials:** Cohesive powdery regolith with angular glassy grains catching specular glints.
- **Motion:** Boot down (0–3 s), grains spray and fall (3–5 s), boot lifts (6–9 s), sharp print (9–10 s).
- **Frames:** START = untouched regolith. END = sharp empty bootprint.
- **Loop:** No.
- **Files:** `web/public/media/cinematic/moon/egz04-bootprint.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Extreme macro photograph of untouched lunar regolith: fine powdery grey soil with tiny angular
glassy grains catching glints of hard low sunlight from the left, microscopic pits and clumps casting
crisp shadows. 100 mm macro, 30 cm above the surface, 45 degrees down. Neutral warm grey, black
shadows with detail, photoreal, fine film grain, 16:9.
```

**IMAGE PROMPT · END**
```
Extreme macro of a perfectly sharp, deep bootprint in grey lunar regolith, ribbed tread pattern with
razor-crisp edges, hard low sunlight from the left filling the tread with crisp black shadows. No dust
in the air. 100 mm macro. Photoreal, neutral warm grey, fine film grain, 16:9.
```

**VIDEO PROMPT**
```
Extreme macro, 100 mm. A plain ribbed boot sole presses down into fine grey lunar regolith in hard low
sunlight. The grains slip and spray outward in perfect ballistic arcs and fall instantly: in vacuum
there is no dust cloud and nothing drifts. The boot lifts slowly and reveals a razor-sharp bootprint
with crisp shadows in every rib of the tread. Camera nearly static with a slight push-in. Photoreal,
neutral warm grey, deep shadows with detail, fine film grain.
```
- **Ingredients:** START and END stills.

---

## EGZ-05 · THROUGH THE DUST
- **Role:** Transition plate between the Moon (chapter 2) and Mars (chapter 3). Three seconds of
  passage: the black sky fills with butterscotch dust, and a crater floor emerges below.
- **Concept:** We fall out of space into the Martian sky: layers of dust haze part like curtains and
  Jezero's rim and floor appear, warm and enormous.
- **Subject / environment:** Martian atmosphere from 8 km down to 2 km, a large crater with a fan
  delta.
- **Camera:** Descending, looking 30° below the horizon.
- **Movement:** Steady downward-forward descent; haze layers pass the lens.
- **Lens / composition:** 28 mm, horizon on the upper fifth.
- **Lighting:** Sun 10° high behind the camera; haze glows butterscotch; ground warm ochre.
- **Grade:** Butterscotch to rust; shadows brown-violet.
- **Atmosphere:** Thick layered dust haze that thins as we descend.
- **Materials:** Crater rim, dark sand, a fan-shaped delta.
- **Motion:** Haze streaming past; slow reveal.
- **Frames:** START = almost uniform glowing haze with a hint of horizon. END = clear crater floor.
- **Loop:** No.
- **Files:** `web/public/media/cinematic/transitions/egz05-through-the-dust.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Inside the Martian sky looking down at 30 degrees: soft layered butterscotch dust haze glowing in
low sunlight, the faint curved outline of an enormous crater rim barely visible through the haze far
below. Photoreal, warm ochre and rust, soft gradients, 28 mm, fine film grain, 16:9.
```

**IMAGE PROMPT · END**
```
Aerial view from 2 km above the floor of a vast Martian crater: an ancient fan-shaped river delta
with layered sediment and winding channels, dark sand dunes, the crater rim on the horizon under a
butterscotch sky. Low warm sunlight from behind the camera. Photoreal, ochre and rust with
brown-violet shadows, 28 mm, fine film grain, 16:9.
```

**VIDEO PROMPT**
```
A steady descent through the Martian atmosphere. Layers of glowing butterscotch dust haze stream
past the lens and part like curtains, revealing far below the floor of a vast crater with an ancient
fan-shaped river delta, dark dunes and the rim on the horizon. Low warm sunlight from behind. Smooth,
heavy, unhurried motion. Photoreal, ochre and rust, soft haze, fine film grain.
```
- **Ingredients:** START and END stills; reference `web/public/hero/mars-jezero-2560.jpg`.

---

## EGZ-06 · DELTA AT DUSK
- **Role:** Chapter 3 (Mars) main plate. Pure cinema, no interaction underneath.
- **Concept:** The Martian sunset is blue. We skim low over the layered fronts of the Jezero delta
  while the small Sun sets behind the western rim inside a pale blue aureole, and the ochre ground goes
  violet.
- **Subject / environment:** Eroded delta scarps with stacked sedimentary layers, dark basaltic sand,
  scattered boulders; the crater rim on the horizon.
- **Camera:** 25 m above the ground, flying toward the setting Sun.
- **Movement:** Slow forward glide with a gentle rise over a scarp at 6 s.
- **Lens / composition:** 35 mm. Sun left of centre on the horizon, scarp on the right, darker left.
- **Lighting:** Sun 3° high, backlight; blue-white aureole; rim-lit boulders.
- **Grade:** Butterscotch sky high, blue around the Sun, ground ochre to violet in shadow.
- **Atmosphere:** Dusty haze increasing with distance; faint dust lifted at the scarp crest.
- **Materials:** Fine layered sediment benches, ventifacts, dark sand ripples.
- **Motion:** Glide, gentle rise; drifting dust at the crest.
- **Frames:** START = facing a layered scarp. END = over the crest, the plain and Sun ahead.
- **Loop:** No.
- **Files:** `web/public/media/cinematic/mars/egz06-delta-at-dusk.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Photoreal low view 25 metres above the floor of Jezero-like Martian crater at sunset, flying toward
the setting Sun: a tall eroded scarp of stacked sedimentary layers on the right, dark basaltic sand
ripples and scattered boulders with glowing rims in the foreground. The small Sun sits on the far
crater rim inside a pale blue-white aureole; the sky is butterscotch above and blue around the Sun.
Shadows brown-violet. 35 mm, left side darker. Fine film grain, 16:9.
```

**IMAGE PROMPT · END**
```
Photoreal view just after cresting a layered Martian scarp at sunset: a wide dark sand plain
stretches to the crater rim, the small Sun on the horizon in a pale blue aureole, faint dust lifted
along the crest catching backlight, the ground turning violet in the long shadows. 35 mm, fine film
grain, 16:9.
```

**VIDEO PROMPT**
```
A slow glide 25 metres above the floor of a Martian crater at sunset, flying toward the small setting
Sun. A tall scarp of stacked sedimentary layers passes on the right, boulders glow with thin rims of
backlight, dark sand ripples flow beneath. At the halfway point the camera rises gently over the crest
of the scarp and reveals a wide plain and the far crater rim. The Sun sits inside a pale blue aureole
in a butterscotch sky; the ground goes from ochre to violet in shadow; a little dust lifts off the
crest in the light. Calm, monumental, photoreal, 35 mm, fine film grain.
```
- **Ingredients:** START and END stills; reference `web/public/hero/mars-jezero-2560.jpg`.

---

## EGZ-07 · THE PROCESSION
- **Role:** Chapter 3 closing plate, monumental. Dust devils show the one thing every Mars twin on Earth
  lacks: a world-scale atmosphere of dust.
- **Concept:** A procession of dust devils, each a kilometre tall, crosses the crater floor in
  silence, leaving dark tracks on the bright ground behind them.
- **Subject / environment:** Flat crater floor, bright dust over darker substrate, a rim on the
  horizon.
- **Camera:** On a low rise, 15 m high, 3 km from the vortices.
- **Movement:** Very slow lateral dolly left→right parallel to the procession.
- **Lens / composition:** 85 mm telephoto, compressed; three or four columns at different distances.
- **Lighting:** Afternoon Sun 12° high from the left; columns backlit at their edges.
- **Grade:** Warm butterscotch; dark tracks brown.
- **Atmosphere:** Hazy; columns fade with distance.
- **Materials:** Bright dust film, dark curving tracks crossing each other.
- **Motion:** Rotating columns drifting right; dust curling at their bases.
- **Frames:** START = columns entering frame left. END = columns mid-frame, tracks behind them.
- **Loop:** Optional (lateral dolly loops well with a crossfade).
- **Files:** `web/public/media/cinematic/mars/egz07-the-procession.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Telephoto 85 mm photoreal view across a flat Martian crater floor in hazy afternoon light: four
enormous dust devils, each over a kilometre tall, thin rotating columns of dust at different
distances, lit from the left with glowing edges, leaving long dark curving tracks across the bright
dusty ground. Crater rim faint on the horizon. Butterscotch sky. Compressed perspective, fine film
grain, 16:9.
```

**VIDEO PROMPT**
```
Telephoto, 85 mm, slow lateral dolly from left to right. A silent procession of enormous dust devils,
each a kilometre tall, crosses a flat Martian crater floor; their thin columns rotate slowly and
drift right, dust curling at their bases, leaving long dark tracks on the bright ground. They fade
with distance into the butterscotch haze. Lit from the left, edges glowing. Monumental, quiet,
photoreal, fine film grain.
```
- **Ingredients:** START still.

---

## EGZ-08 · THE POINTING
- **Role:** Opens the **Same Ground** chapter (the interactive Mars→Earth match). A human gesture
  that becomes the page's interaction: someone points at Mars; the map answers with Earth.
- **Concept:** A dark planning room. A large horizontal relief map of Mars glows softly on a table,
  lit like a museum object. A hand moves in and points at a crater. A pause: the person is thinking.
  The relief slowly turns: Mars rotates away and Earth's desert plateaus rise in its place, and the
  same finger now rests on a matching ground. One gesture, two planets.
- **Subject / environment:** Physical-looking 3D relief map (not a screen, no UI), a hand and forearm
  in a dark sleeve, a dim room.
- **Camera:** 70 cm above the table, 35° down, over the shoulder.
- **Movement:** Slow push toward the fingertip; tiny rack focus from map to finger and back.
- **Lens / composition:** 50 mm, shallow depth of field, map fills the frame.
- **Lighting:** A single warm overhead pool on the map; cool fill from the map's own glow on the hand.
- **Grade:** Ochre Mars relief, then ochre/olive/blue Earth; deep warm-black surroundings.
- **Atmosphere:** Faint haze in the room light beam.
- **Materials:** Matte relief map with real geological detail (crater, delta, plateaus), skin with
  natural texture, dark wool sleeve.
- **Motion:** Hand enters (0–2 s), points at the crater (2–4 s), pause (4–5 s), map morphs Mars→Earth
  (5–8 s), finger rests on the Earth plateau (8–10 s).
- **Frames:** START = Mars relief map with a crater and delta, no hand. END = Earth relief of a desert
  plateau with the fingertip touching it.
- **Loop:** No.
- **Files:** `web/public/media/cinematic/missions/egz08-the-pointing.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
A large horizontal physical relief map of a region of Mars on a table in a dark room, lit by a
single warm overhead light: a big impact crater with an ancient fan-shaped river delta inside it,
layered terrain and dunes sculpted in fine ochre and rust relief with real geological detail, soft
shadows showing height. Photographed from 70 cm above at 35 degrees, 50 mm lens, shallow depth of
field, the surroundings falling into warm black. No text, no screens. Photoreal, fine film grain,
16:9.
```

**IMAGE PROMPT · END**
```
The same table and lighting: the physical relief map now shows a desert plateau on Earth with
canyons, volcanic cones and dry riverbeds in ochre, olive and grey relief. A human index finger in a
dark wool sleeve rests on one plateau, in sharp focus, the rest of the map softly out of focus.
Photographed from 70 cm above at 35 degrees, 50 mm, warm overhead light, dark room. No text, no
screens. Photoreal, fine film grain, 16:9.
```

**VIDEO PROMPT**
```
A dark planning room. On a table lies a large physical relief map of a region of Mars, lit by one
warm overhead light: a big crater with a fan-shaped delta, ochre and rust relief. A hand in a dark
wool sleeve enters from the right and points at the crater; it pauses there for a moment, thinking.
Then the relief slowly transforms: Mars's terrain sinks and rotates away and an Earth desert plateau
with canyons and volcanic cones rises in its place, ochre and olive. The finger now rests on the
matching Earth plateau. Slow push toward the fingertip, gentle rack focus. Photoreal, 50 mm, shallow
depth of field, quiet and thoughtful, no text, no screens, fine film grain.
```
- **Ingredients:** START and END stills. Optional texture references: `web/public/textures/mars.jpg`,
  `web/public/textures/earth.jpg`.

---

## EGZ-09 · TEN THOUSAND GROUNDS
- **Role:** Chapter 4 (Method) opening plate, planetary scale. Hands off to the live fidelity field.
- **Concept:** The search seen from orbit: dawn's terminator sweeps across Earth's deserts (Sahara,
  Arabia, the Tibetan plateau, the Atacama), and for an instant each desert looks like another planet.
  This is the pool EGIZ searches.
- **Subject / environment:** Earth from 400 km, deserts and mountain belts, thin clouds.
- **Camera:** Low Earth orbit, looking 60° down toward the terminator.
- **Movement:** Orbital drift, imperceptibly slow.
- **Lens / composition:** 50 mm; terminator crossing diagonally.
- **Lighting:** Sunrise along the terminator: long shadows on mountain belts, warm desert tones.
- **Grade:** Natural Earth colours, slightly warm, deep blue oceans, black space at the top edge.
- **Atmosphere:** Thin blue atmospheric haze along the limb.
- **Materials:** Dune seas, dry riverbeds, salt pans, folded mountains.
- **Motion:** Terminator advancing; clouds barely drifting.
- **Frames:** START = desert in pre-dawn blue. END = desert in low gold light.
- **Loop:** No.
- **Files:** `web/public/media/cinematic/orbital/egz09-ten-thousand-grounds.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Photograph from low Earth orbit at dawn looking down at a vast desert and folded mountain belt, the
day-night terminator crossing the frame diagonally, the dark side in deep blue, the first sunlight
raking across dune seas, salt pans and dry riverbeds and casting long shadows from the mountain
ridges. Thin blue limb and black space at the top edge. Natural colours, photoreal, 50 mm, 16:9.
```

**VIDEO PROMPT**
```
From low Earth orbit at dawn, a slow, almost imperceptible drift over a vast desert. The day-night
terminator advances across the frame: first sunlight rakes over dune seas, salt pans, dry riverbeds
and folded mountain ridges, which cast long shadows, and for a moment the desert looks like another
planet. Thin clouds barely move; a thin blue atmosphere glows at the top edge against black space.
Photoreal, natural colours, calm and immense.
```
- **Ingredients:** START still; reference `web/public/textures/earth.jpg`.

---

## EGZ-10 · FIRST TRACKS
- **Role:** Chapter 6 (Your mission) opening plate. Departure. Hands off to the live mission planner
  drawn on the measured ground.
- **Concept:** A small, generic six-wheeled rover rolls up to the rim of a lunar crater at low sun and
  stops; behind it the only tracks on the whole plain catch the light.
- **Subject / environment:** Lunar plain, crater rim, rover (unbranded, generic geometry).
- **Camera:** Ground level, 1 m high, 10 m to the side of the rover.
- **Movement:** Slow tracking alongside, then the rover stops and the camera keeps drifting forward
  to reveal the crater.
- **Lens / composition:** 35 mm; rover right third, tracks leading into frame.
- **Lighting:** Sun 4° high from behind; rover rim-lit, tracks graphic in low light.
- **Grade:** Neutral grey, warm highlights, black sky.
- **Atmosphere:** None.
- **Materials:** Regolith with crisp twin track ruts, the rover's matte panels and wire wheels.
- **Motion:** Wheels turning, regolith crumbling into ruts, stop, reveal.
- **Frames:** START = rover rolling, tracks behind. END = rover stopped on the rim, crater ahead.
- **Loop:** No.
- **Files:** `web/public/media/cinematic/missions/egz10-first-tracks.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Photoreal ground-level view on the Moon at low sun: a small generic six-wheeled exploration rover with
matte grey panels and open wire-mesh wheels (no logos, no flags) rolls across a grey regolith plain,
rim-lit by a Sun 4 degrees high behind it, leaving the only pair of crisp tracks on the entire plain.
Black sky. 35 mm, camera 1 metre high, rover in the right third. Fine film grain, 16:9.
```

**VIDEO PROMPT**
```
Ground level on the Moon at low sun. A small generic six-wheeled rover with matte grey panels and
wire-mesh wheels rolls slowly across grey regolith, its wheels pressing crisp ruts, the only tracks on
the entire plain glinting behind it. The camera tracks alongside, the rover stops at the rim of a
large crater, and the camera keeps drifting forward to reveal the crater falling away below, its floor
in black shadow. Black sky, hard low backlight, rim-lit edges. No logos, no flags. Photoreal, 35 mm,
fine film grain.
```
- **Ingredients:** START still; optional geometry reference from `web/public/models/` (any rover-like
  GLB you are licensed to use) rendered as a silhouette.

---

## EGZ-11 · THE THIN LINE
- **Role:** Finale (chapter 7). Pure cinema: home, before elsewhere. (When absent, the live shader
  finale shows.)
- **Concept:** From low orbit, Earth's limb at twilight: a razor-thin shell of air in bands of orange,
  cream, blue and violet. The Moon rises *through* it, flattened and reddened, then sharpens into
  black space. Everything we rehearse for happens under that line.
- **Subject / environment:** Earth's night-side limb, the atmosphere shell, the Moon.
- **Camera:** 400 km altitude, telephoto on the limb.
- **Movement:** None; the Moon rises.
- **Lens / composition:** 200 mm; limb across the lower third, the Moon centred above it.
- **Lighting:** Sun just below the limb (twilight); the Moon fully lit.
- **Grade:** Black space, the shell's natural colours, cool night side with faint city lights.
- **Atmosphere:** Layered shell, the Moon distorted by refraction at first.
- **Materials:** Clouds faint on the night side.
- **Motion:** The Moon rising, flattened shape relaxing into a disc.
- **Frames:** START = the Moon touching the shell, flattened and orange. END = the Moon clear above
  the line, white.
- **Loop:** No (holds on END).
- **Files:** `web/public/media/cinematic/orbital/egz11-the-thin-line.mp4`, `.webm`, poster `.jpg`.

**IMAGE PROMPT · START**
```
Photograph from low Earth orbit with a long telephoto lens: Earth's limb at twilight across the lower
third, a razor-thin glowing shell of atmosphere in bands of deep orange, cream, blue and violet
above the dark night side with faint city lights; the Moon rising through the shell, flattened and
reddened by refraction. Black space. Photoreal, 200 mm, fine grain, 16:9.
```

**IMAGE PROMPT · END**
```
Same telephoto composition from low Earth orbit: the Moon now a sharp white disc in black space just
above the thin glowing orange, cream and blue line of Earth's atmosphere, the night side dark below.
Photoreal, 200 mm, fine grain, 16:9.
```

**VIDEO PROMPT**
```
A locked-off telephoto view from low Earth orbit: Earth's limb at twilight, a razor-thin shell of air
glowing in bands of orange, cream, blue and violet above the dark night side. The Moon rises slowly
through the shell, flattened and reddened by refraction, and as it climbs into black space it relaxes
into a sharp white disc. Nothing else moves. Silent, immense, photoreal, 200 mm.
```
- **Ingredients:** START and END stills; reference `web/public/hero/earth-limb-2560.jpg`.

---

## Encoding (after export from Flow)

Run in the folder where the Flow MP4 is saved; replace `IN.mp4` and `NAME`:

```bash
ffmpeg -i IN.mp4 -an -vf "scale=1280:-2:flags=lanczos" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart NAME.mp4
ffmpeg -i IN.mp4 -an -vf "scale=1280:-2:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 NAME.webm
ffmpeg -i IN.mp4 -vf "select=eq(n\,0),scale=1600:-2:flags=lanczos" -frames:v 1 -q:v 3 NAME.jpg
```

- Audio is stripped on purpose. The page has its own opt-in soundscape.
- For a seamless loop (EGZ-03, EGZ-07), first fold the clip's first 2 s over its end (the result is
  8 s and its last frame equals its first), then encode that file as above:

```bash
ffmpeg -i IN.mp4 -an -filter_complex "[0:v]split[x][y];[x]trim=0:2,setpts=PTS-STARTPTS[head];[y]trim=2:10,setpts=PTS-STARTPTS[body];[body][head]xfade=transition=fade:duration=2:offset=6,format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 16 LOOP.mp4
```
- If you only have the still so far, save it as `NAME.jpg` (1600 px wide, quality 85): the page shows
  it with a slow push until the video exists.
