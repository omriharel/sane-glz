# Sane GLZ

An alternative to GLZ's terrible website: pick the GLZ (Galei Tzahal) shows you follow and get one list of
their recent episodes, with a player that remembers where you stopped. Lives at https://glz.omri.io.

## How it works

It's a static single-page app with no backend. Program listings and audio come straight from the browser out of
[Omny Studio](https://omny.fm), the podcast platform GLZ publishes its shows on (`api.omny.fm` allows
cross-origin requests). Your chosen shows and listening progress live in your browser's `localStorage`.

Earlier versions proxied GLZ's own website API through a Lambda function and had sign-in to sync between devices.
That API is gone and glz.co.il now blocks automated access, so both were removed.

## Development

Needs Node 24 (`nvm use`).

```sh
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # unit tests (vitest)
npm run typecheck
npm run lint       # oxlint
npm run build      # production build into dist/
```

## Show categories

Omny doesn't know GLZ's own show categories (חדשות, מוזיקה, ...), so `src/catalog/glzCategories.json` maps Omny
programs to them, based on a snapshot of the programs menu on glz.co.il. Shows missing from the snapshot are
grouped by network instead. To refresh it, save glz.co.il from a browser (it blocks scripts), then:

```sh
python3 scripts/catalog/extract-glz-menu.py ~/Downloads/glz.html
python3 scripts/catalog/build-mapping.py
```

`build-mapping.py` prints the menu entries it couldn't match; add any obvious renames to its `ALIASES`.

## Deployment

Hosted on S3 + CloudFront in AWS, set up by scripts rather than infrastructure-as-code.

```sh
scripts/setup-hosting.sh   # one-time: certificate, bucket, distribution; writes scripts/hosting.env
scripts/point-dns.sh       # one-time: point glz.omri.io at the distribution
scripts/deploy.sh          # build and publish
```
