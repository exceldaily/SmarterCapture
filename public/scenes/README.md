# Scene photos — how to add them

Drop a file here named after the scene id, then add a credit entry in
`lib/camcue/data/scene-photos.ts`. The photo appears once the credit exists.
No credit, no photo. That is on purpose: it means nothing can go live without
its licence being recorded and shown on `/credits`.

```
public/scenes/fishing.jpg          ->  scene id "fishing"
public/scenes/night-market.jpg     ->  scene id "night-market"
```

Scene ids are the `id` fields in `lib/camcue/data/scenes.ts`.

## What to look for

**Landscape, roughly 3:2 or 16:9.** Cards crop to about 4:3 on mobile and
wider on desktop, so keep the subject away from the extreme edges.

**1600px wide is plenty.** Next.js generates the smaller sizes. Anything above
2000px is wasted bytes. Export JPEG at quality 75-82.

**Subject slightly off-centre reads better** than a dead-centre subject,
because text sits over the bottom of the card.

**Avoid:** visible brand logos on cameras, recognisable faces, and anything
that looks like an advertisement. See the licensing notes below for why.

## Where to get them

| Source | Cost | Attribution | Notes |
| --- | --- | --- | --- |
| [Unsplash](https://unsplash.com) | Free | Not required | Best for outdoor and action. Use `source: "unsplash"` |
| [Pexels](https://pexels.com) | Free | Not required | Strong on travel and food. Use `source: "pexels"` |
| [Pixabay](https://pixabay.com) | Free | Not required | Bigger but less curated |
| Your own camera | Free | None | Use `source: "own"` |
| Adobe Stock / Shutterstock | Paid | Per licence | Comes with indemnification if this becomes commercial |

We credit free-stock photographers on `/credits` even where the licence does
not demand it. It costs nothing and it is the right way to treat the people
whose work carries the design.

## Two licensing rules that actually matter

**1. Recognisable people.** Free stock sites do not guarantee model releases.
A clearly identifiable face on a commercial site is a real risk, and their
licences specifically forbid using an image in a way that implies the person
endorses a product. Prefer backs of heads, distance shots, hands, and gear.
Action and POV scenes suit this naturally.

**2. Nothing that implies endorsement.** This site is an independent guide. It
is not affiliated with DJI, GoPro, Insta360, Sony, Canon, Nikon, Fujifilm or
Panasonic. Naming a camera to say what settings it takes is ordinary
descriptive use. What we must never do is present the site as though a
manufacturer approved, sponsored or partnered with it. In practice:

- Do not use manufacturer press or PR photography. It is licensed for
  editorial and press use, not for promoting a third-party product.
- Do not use manufacturer logos as decoration or as section headers.
- Do not pick photos that read like an official product advertisement.
- Photos of gear in real use are fine. Studio hero shots lifted from a brand
  are not.

## Search terms per scene

Starting points. Search the scene name too.

| Scene id | Try searching |
| --- | --- |
| `fishing` | offshore fishing boat, angler rod ocean |
| `boating` | speedboat wake, boat bow ocean |
| `beach` | tropical beach aerial, shoreline waves |
| `hiking` | hiking trail forest, backpack mountain path |
| `camping` | campfire tent night, camping forest |
| `nature` | forest light rays, woodland stream |
| `wildlife` | bird flight, deer forest, wildlife telephoto |
| `ocean` | ocean waves aerial, underwater blue |
| `mountains` | mountain range sunrise, alpine peaks |
| `sunrise` | sunrise horizon, dawn sky |
| `sunset` | golden hour sunset, sunset silhouette |
| `motorcycle` | motorcycle rider road, helmet POV riding |
| `cycling` | cyclist mountain trail, road cycling |
| `snowboarding` | snowboarder powder, snowboard jump |
| `skiing` | skier powder snow, ski slope |
| `surfing` | surfer wave barrel, surfboard ocean |
| `motorsports` | race car track, motorsport panning |
| `sports` | basketball action, football match |
| `gym` | gym weights training, dumbbell workout |
| `boxing` | boxing gloves gym, martial arts training |
| `running` | trail runner, running silhouette |
| `walking-tour` | city street walking, alley travel |
| `city` | city skyline dusk, urban street |
| `night-market` | night market neon, street food stalls night |
| `restaurant` | restaurant interior warm, dining table |
| `food-video` | food closeup steam, plated dish |
| `airport` | airport window plane, terminal travel |
| `road-trip` | road trip highway, car dashboard road |
| `hotel` | hotel room window, resort interior |
| `theme-park` | theme park ride, ferris wheel |
| `architecture` | building facade symmetry, architecture lines |
| `talking-head` | person talking camera setup, home studio |
| `interview` | interview two chairs, podcast setup |
| `family` | family walking beach, family outdoors |
| `kids` | kids running park, child playing |
| `pets` | dog running field, cat closeup |
| `wedding` | wedding ceremony, bride groom outdoor |
| `party` | party lights people, celebration night |
| `event` | concert crowd, stage lights event |
| `tiktok` | phone vertical filming, creator ring light |
| `instagram-reel` | creator filming phone, content creation |
| `youtube` | video setup desk, camera tripod studio |
| `vlog` | vlogger walking camera, handheld filming |
| `cinematic` | cinematic gimbal shot, film camera rig |
| `product` | product photography setup, studio lighting |
| `streaming` | streaming setup desk, gaming room lights |
| `podcast` | podcast microphone, recording studio |
| `slowmo` | water splash freeze, high speed droplet |
| `timelapse` | star trails, cloud timelapse sky |
| `hyperlapse` | city hyperlapse blur, motion street |
| `night` | night sky stars, dark street lights |
| `city-lights` | bokeh city lights, neon night street |
| `underwater` | underwater snorkel, coral reef diver |
| `fake-drone` | aerial drone view, overhead landscape |
| `cinematic-shot` | film set lighting, moody cinematic |
| `tracking-shot` | running follow shot, motion blur subject |
| `photo` | camera in hands, photographer shooting |
