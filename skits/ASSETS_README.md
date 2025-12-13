# Skit Character Assets

Place the skit character PNGs under the `/assets/skit` directory. Each character has their own subfolder:

- Shion: `/assets/skit/shion`
- Lumiere: `/assets/skit/lumiere`
- Shiopon: `/assets/skit/shiopon`

## Naming rules
- Keep filenames lowercase with hyphens separating words (e.g., `calm-smile.png`).
- Use the exact filenames listed in `assets_manifest.json` to ensure the manifest and checklist stay accurate.

## Preparing the folders
Run the scaffolding script from the repository root to create the required directories and placeholder PNG files:

```sh
node scripts/scaffold_skit_assets.js
```

The script is safe to rerun; it only creates missing directories and files. Replace the placeholder PNGs with the final artwork once available.
