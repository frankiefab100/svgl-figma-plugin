# Contributing to SVGL Logos for Figma

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Development Setup

Follow the [Installation & Development](README.md#local-development) guide in the README to set up your local environment. Once running, you should have:

- Vite dev server running
- Figma Desktop App ready for plugin testing

Key conventions:

- Double quotes, semicolons, 2-space indent
- Trailing commas (ES5 style)
- Import order is auto-sorted

## TypeScript

Strict mode is enabled. Before submitting a PR, run:

```bash
npm run build
```

The build process includes type checking, so if the build passes, your types are valid.

## Project Structure

```
src/
  ui/              → React UI components
  plugin/          → Figma plugin code (plugin.ts)
  types/           → TypeScript type definitions
  utils/           → Helper functions
dist/              → Built plugin files (auto-generated)
manifest.json      → Figma plugin manifest
vite.config.ts     → Vite build 
```

## Getting Started

### Prerequisites

- Git or any equivalent Version Control System
- Code Editor (e.g., VSCode, Cursor)
- Basic knowledge of the Command Line Interface (CLI)

### Helpful Resources

> If you have no experience in Open Source contribution and the use of Git/GitHub, check these resources:

- [**GitHub For Beginners**](http://readwrite.com/2013/09/30/understanding-github-a-journey-for-beginners-part-1/)
- [**Basic Git Workflow**](https://guides.github.com/introduction/flow/index.html)

### Steps

Before installation, please make sure you have already installed the following tools:

- [Node.js](https://nodejs.org/en/download/) (v20 or higher)
- [Git](https://git-scm.com/downloads)
- [Figma Desktop App](https://figma.com/downloads/)

Then, follow the guidelines below for a successful contribution:

**1.** Fork [this](https://github.com/frankiefab100/svgl-figma-plugin) repository.

**2.** Clone your forked copy of the project.

```bash
git clone [https://github.com/](https://github.com/)<your-username>/svgl-figma-plugin
```

**3.** Go to the project directory.

```bash
cd svgl-figma-plugin
```

**4.** Add a reference (remote) to the original repository.

```bash
git remote add upstream [https://github.com/frankiefab100/svgl-figma-plugin](https://github.com/frankiefab100/svgl-figma-plugin)
```

**5.** Confirm the remote for this repository.

```bash
git remote -v
```

**6.** To set up the environment on your system, run the following commands:

```bash
npm install
```

**7.** Check if your cloned repo syncs with the upstream repository.

```bash
git pull upstream main
```

**8.** Create a new branch.

```bash
git checkout -b <your-branch-name>
```

**9.** Make necessary changes to the project codebase.

**10.** Add your changes.

```bash
git add .
```

**11.** Commit your changes with a message.

```bash
git commit -m "feat: add search filter"
```

**12.** Push the committed changes in your branch.

```bash
git push origin <your-branch-name>
```

**13.** Go to the repository on GitHub, click `Compare & Pull Request`.

**14.** Compare your feature branch to the desired branch of the repo you are supposed to make a PR to.

**15.** Add an appropriate title and description to your pull request explaining your changes and efforts, then click on Create Pull Request.

**16.** Wait for your submission to be reviewed, approved, and your PR to be merged.

Bravo! 🎉

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add search filter by category
fix: resolve SVG import scaling issue
refactor: simplify logo preview component
docs: update installation guide
chore: bump dependencies
```

Keep commit messages concise and focused on the "why" rather than the "what".

## Pull Request Process

1. **Branch from `main`** using a descriptive name:
   - `feat/search-filter`
   - `fix/svg-scaling-issue`
   - `docs/installation-guide`

2. **Keep PRs focused** — one feature or fix per PR. Smaller PRs get reviewed faster.

3. **Before opening a PR**, make sure:

   ```bash
   npm run build          # Build succeeds
   ```

4. **Write a clear PR description** with:
   - What changed and why
   - How to test the changes
   - Screenshots or GIFs for UI changes

5. **Address review feedback** promptly. If a suggestion doesn't apply, explain why.

## Report Bugs

If you ever notice a bug or anything worth fixing, feel free to [**Open an issue**](https://github.com/frankiefab100/svgl-figma-plugin/issues) with enough details of the bug, steps to fix it, and screenshots if possible.

You can choose templates for issues [here](https://github.com/frankiefab100/svgl-figma-plugin/issues/new/choose).

Include:

- A clear title describing the problem
- Steps to reproduce (include Figma version)
- Expected vs. actual behavior
- Environment details (Node version, OS, Figma version)
- Error messages or screenshots if applicable

## Submit Feedback

The best way to send feedback is to file an issue at <https://github.com/frankiefab100/svgl-figma-plugin/issues>.

If you are proposing a feature:

- Explain in detail how it would work and why it should be included.
- Keep the scope as narrow as possible, to make it easier to implement.

## License

Your submissions are understood to be under the same [MIT License](https://opensource.org/licenses/MIT) that covers the project.

**[Back to README](./README.md)**
