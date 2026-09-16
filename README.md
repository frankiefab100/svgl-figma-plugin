<div align="center">
  <h1>SVGL Logos for Figma</h1>
  <p>A fast, lightweight Figma plugin to search, preview, and import over 650 high-quality vector brand logos directly into your Figma design canvas, powered by the <a href="https://svgl.app">svgl.app</a> open source SVG logo library.</p>

  <p>
    <a href="https://github.com/frankiefab100/svgl-figma-plugin/stargazers">
      <img src="https://img.shields.io/github/stars/frankiefab100/svgl-figma-plugin?style=flat-square" alt="GitHub Repo stars"/>
    </a>
    <a href="https://github.com/frankiefab100/svgl-figma-plugin/issues">
      <img src="https://img.shields.io/github/issues/frankiefab100/svgl-figma-plugin?style=flat-square" alt="GitHub issues"/>
    </a>
    <a href="https://github.com/frankiefab100/svgl-figma-plugin/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/frankiefab100/svgl-figma-plugin?style=flat-square" alt="License" />
    </a>
    <a href="http://makeapullrequest.com">
      <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"/>
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma Plugin">
  </p>
  
  <img width="1920" height="960" alt="SVGL Logos for Figma Banner" src="https://github.com/user-attachments/assets/61143639-6d50-4f6e-8741-546f68c62fff" />
</div>

## ⚡ Features

* **Global Search:** Find any brand logo indexed by SVGL in milliseconds by name, category, or tags.
* **Categorized Browsing:** Filter logos across design, tech, payment gateways, AI, authentication, social media, and more.
* **Batch Import:** Select multiple logos and insert them all at once onto your canvas.
* **Flexible Insert Options:** Import logos as clean, editable SVGs or reusable Figma Components.
* **Custom Sizing:** Choose preset export dimensions: `23px`, `32px`, `48px`, `64px`, or `128px`.
* **Favorites System:** Save your most-used brand logos to a dedicated favorites tab for quick access.
* **Theme Adaptability:** Includes full Light and Dark mode UI support.
* **Optimized Performance:** Smart local caching prevents rate-limiting and ensures rapid image rendering.

## 🧩 Figma Community Link

[Install SVGL Logos for Figma](https://www.figma.com/community/plugin/1681508305173345973/svgl-logos-for-figma)

## 🛠️ Tech Stack

Built with:
* [Vite](https://vitejs.dev) - Next-generation frontend tooling
* [React](https://react.dev) - UI library
* [TypeScript](https://www.typescriptlang.org) - Type safety
* [@figma/plugin-typings](https://github.com/figma/plugin-typings) - Figma plugin API types
* [svgl.app](https://svgl.app) - Open source SVG logo library

## 📦 Installation

### From Figma Community (Recommended)

1. Open Figma Desktop App or the official website
2. Go to **Resources** → **Plugins**
3. Search for **"SVGL Logos for Figma"**
4. Click **Install**

## Local Development

### Prerequisites

* [Node.js](https://www.google.com/search?q=https://nodejs.org/) (v20 or higher)
* [Figma Desktop App](https://figma.com/downloads/)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/frankiefab100/svgl-figma-plugin.git
cd svgl-figma-plugin
```

2. Install dependencies:
```bash
npm install

```

3. Build the plugin:
```bash
npm run build
```

This compiles `dist/index.html` and `dist/code.js`.

4. Watch mode for rebuild (optional):

```bash
npm run dev
```

### Loading into Figma

1. Open the **Figma Desktop App**.
2. Go to **Plugins -> Development -> Import plugin from manifest...**
3. Select the `manifest.json` file in the root of this repository.
4. Run the plugin from **Plugins -> Development -> SVGL Logos**.

## 🤝 Contributing

Contributions and feature suggestions are welcome! Feel free to open an issue or submit a pull request.

Please review the [Contributing Guide](./CONTRIBUTING.md) before contributing.

## 📜 License

This plugin is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

> **Note:** The MIT license applies strictly to the source code wrapper of this plugin. It does not grant rights to the `svgl.app` brand or individual company trademarks fetched via the API.

## 🙏 Acknowledgments

* [pheralb](https://github.com/pheralb) and the contributors at [svgl.app](https://svgl.app) for maintaining the SVG logo library.
* The [Figma Plugin API](https://developers.figma.com/docs/plugins) team.

## ⚠️ Disclaimer

**This is an unofficial integration and is not affiliated with, sponsored by, or endorsed by svgl.app or Figma.** Logos provided through this plugin represent corporate trademarks. Users are responsible for ensuring appropriate legal permission before using trademarked logos in commercial projects.

---

<div align="center">
  <sub>Made with ❤️ for the design community
</sub>
</div>
