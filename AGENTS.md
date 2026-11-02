<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The site's original server HTML (src/lib/site-pages/*.html) is served at its original addresses (/, /contact, /projects, /world) by route server handlers, because the site's scripts pick the 3D scene from the address; static files live in public/site/assets and the /wp-content/$ route redirects original WordPress file paths to them via src/lib/site-asset-map.json.
- Site media lives as real files in public/site/assets so a remix reproduces the site; only files too large for the repo (intro video, company profile PDF) stay in Lovable Assets and are referenced by the original project's published absolute URL, because asset URLs only resolve on the owning project's domains.
- Resolve known bundled asset URLs directly in the exported HTML and scene asset helper to avoid redirect overhead; retain the WordPress compatibility handler for unmapped requests.
- Keep scene geometry and textures in the opening readiness gate, but load optional audio independently so sound downloads cannot delay entry or strand the loader.
- Extra music tracks (TRACKS in public/site/assets/dm-extras.js) play through a Web Audio filter+gain that copies the built-in song's live filter, volume and speed every frame (the built-in song keeps playing silently as the guide), so any new track added to TRACKS automatically reacts to water, page changes and World.
- NotePin (/notepin/) reuses the Projects water scene with the camera flipped upward, plus its own DOM overlay from dm-extras.js; leaving it reads window.__dmFromNp in the scene's out-transitions so the camera descends, and NotePin tiles are kept out of projects.html so they never show on Projects.
- Interstellar plays only on NotePin and World and ducks all other music (Howler master gain and the extra-track gain) there, so two songs never overlap.
- Render sharpness is tiered: the scene's starting pixel ratio comes from device strength (window.__dmPR) and dm-extras.js steps it down/up from measured frame rate, so slow phones stay smooth.
- NotePin's page layer and top bar sit above the site-wide purple colour wash (html::after, mix-blend color), so the product shows in its true colours there; other pages keep the wash.
- Examples (public/examples/*.html) are standalone pages opened inside the site in a sliding iframe layer from dm-extras.js, so their heavy 3D code never loads on Home and they stay separate from the water scene.
