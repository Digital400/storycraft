# GitHub Packages Setup

This repository publishes StoryCraft as a private npm package using GitHub Packages.

## Package name

- `@digital400/storycraft`

## Publish options

1. Manual from local machine

```bash
npm login --scope=@digital400 --registry=https://npm.pkg.github.com
npm publish
```

2. GitHub Actions (recommended)

- Workflow file: `.github/workflows/publish-github-packages.yml`
- Trigger:
  - publish a GitHub Release, or
  - run workflow manually from Actions tab

## Install on developer machines

1. Add this to `~/.npmrc`

```ini
@digital400:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

2. Required token scopes

- `read:packages`
- `repo` (for private repositories)

3. Install globally

```bash
npm install -g @digital400/storycraft
```

4. Verify

```bash
sdlc --version
sdlc storycraft --help
```
