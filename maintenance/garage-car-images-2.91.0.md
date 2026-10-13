# Photographic Garage vehicles — 2.91.0

Five independent transparent vehicle illustrations were generated with the built-in `image_gen` tool. They use an elevated front-left three-quarter view, realistic white paint, studio lighting and model-specific body and fascia details. These are AI-generated catalogue illustrations, not photographs of employees’ actual vehicles.

Final project assets are in `assets/garage/cars/` and mirrored under `nahlad/assets/garage/cars/`. The manifest lists each exact hashed WebP filename and the source frame dimensions. Native generated PNGs remain locally available as sibling `*-white.png` files and in the Codex generated-images folder; they are excluded from this public release. WebP encoding preserves transparency and original dimensions; all five released images total approximately 640 KiB.

## Prompt set

Common brief: one full-sized, photorealistic manufacturer-configurator vehicle, viewed from the front-left at approximately 30° elevation. Front points toward the lower-left, rear toward the upper-right. Entire vehicle visible; genuine transparent background. White pearl paint, natural black tyres, alloy wheels, realistic dark glass, fine body seams and neutral softbox reflections. No environment, text, people, registration numbers, watermarks, toy proportions or vector styling. The RAV4 render serves only as a camera and lighting reference for the other four vehicles.

- Toyota RAV4: approximately 2021 European fifth-generation SUV, angular grille and narrow headlamps, substantial SUV proportions and black lower arch cladding.
- Škoda Octavia sedan: approximately 2021 European fourth-generation liftback, angular headlamps, vertical grille slats, low stance, shorter roof and visible sloping rear window and boot deck.
- Škoda Octavia Combi: approximately 2021 European fourth-generation estate, extended roof, roof rails, large rear luggage-compartment side window and rear hatch.
- Škoda Kodiaq: approximately 2022 European first-generation facelift SUV, split headlamps, broad tall body, extended cabin, roof rails and substantial wheel arches.
- Volkswagen Arteon Shooting Brake: approximately 2021 European estate, low broad horizontal grille and slim lights, long bonnet and sleek extended roof and rear body.

## Application behaviour

Known models use the generated photographic assets; saved vehicle model and colour remain independent per user. The renderer previews model and colour choices before saving. Existing owner names, intervals, permissions and reservation logic are retained. Assets and the image renderer participate in the hashed PWA shell for both published targets. The photos alone need no backend change; the combined 2.91.0 release also contains automatic parking and requires the Golem redeploy described in garage-simple-parking-2.91.0.md.
