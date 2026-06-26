# Changesets

This folder holds [changesets](https://github.com/changesets/changesets). Run
`pnpm changeset` to describe a change; CI uses these to version and publish `pagelathe`.
Only the published `pagelathe` package is versioned here. The private
`@pagelathe/*` workspace packages (the app engine and section registry) are
listed in `ignore` in `config.json` so Changesets never tries to version them.
