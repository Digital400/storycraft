# Publishing and Install Setup

This repository publishes StoryCraft to npmjs so developers can install with one command and no registry config.

## Package name

- `@digital400/storycraft`

## Publish options

1. Manual from local machine

```bash
npm login
npm publish
```

2. GitHub Actions (recommended)

- Workflow file: `.github/workflows/publish-github-packages.yml`
- Trigger:
  - publish a GitHub Release, or
  - run workflow manually from Actions tab
- Required repo secret:
  - `NPM_TOKEN` (npm automation token)

## Install on developer machines

1. One command install in any project folder

```bash
npx @digital400/storycraft install
```

2. Start workflow in VS Code chat

```text
/sdlc-storycraft-start
```

3. Optional global install

```bash
npm install -g @digital400/storycraft
```

4. Verify

```bash
sdlc --version
sdlc storycraft --help
```
