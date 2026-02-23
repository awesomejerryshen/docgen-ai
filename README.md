# DocGen AI

> AI-powered code documentation generator. Stop writing docs, start shipping code.

[![npm version](https://badge.fury.io/js/docgen-ai.svg)](https://badge.fury.io/js/docgen-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/awesomejerry/docgen-ai.svg?style=social)](https://github.com/awesomejerry/docgen-ai)

## 🚀 What It Does

Automatically generates and maintains documentation for your code repositories:
- **README files** with installation, usage, examples
- **API documentation** from code comments
- **Architecture overviews** 
- **Changelogs** from commit history
- **Code examples** and usage patterns

## ⚡ Quick Start

```bash
# Install globally
npm install -g docgen-ai

# Generate docs for your project
cd your-project
docgen generate .

# That's it! Check ./docs/ for your documentation
```

## 🎯 Why DocGen AI?

- **🤖 AI-Powered**: Uses GPT-4 to understand your code and generate clear, helpful docs
- **⚡ Lightning Fast**: Generate comprehensive docs in seconds, not hours
- **🔄 Auto-Sync**: Keep docs up-to-date as your code changes
- **📦 Multi-Language**: Supports JavaScript, TypeScript, Python, and more
- **🎨 Customizable**: Templates and config files for your team's style
- **🔗 GitHub Integration**: Clone and document any public repo

## 📖 Features

### Smart Code Analysis
- Detects frameworks (React, Vue, Express, etc.)
- Extracts functions, classes, and modules
- Identifies design patterns
- Maps dependencies

### AI Documentation
- Clear installation instructions
- Usage examples with code
- API reference documentation
- Architecture diagrams (coming soon)

### Format Support
- Markdown (default)
- HTML (coming soon)
- Custom templates

### Config File Support
Create `.docgenrc` in your project:

```json
{
  "output": "./docs",
  "format": "markdown",
  "badges": {
    "npm": true,
    "github": true
  },
  "sections": {
    "installation": true,
    "usage": true,
    "api": true
  }
}
```

## 🛠️ CLI Commands

```bash
# Generate documentation
docgen generate <path> [options]

# Options:
  -o, --output <dir>      Output directory (default: "./docs")
  -f, --format <type>     Output format: markdown, html (default: "markdown")
  -t, --template <name>   Documentation template (default: "default")
  -d, --dry-run           Preview without writing files
  --api-key <key>         OpenAI API key (or set OPENAI_API_KEY env var)

# Examples:
docgen generate .                           # Generate docs for current directory
docgen generate ./my-project -o ./output    # Custom output directory
docgen generate https://github.com/user/repo # Clone and document GitHub repo
docgen generate . --dry-run                 # Preview without writing
```

## 💡 Example Output

### Before (Your Code)
```typescript
/**
 * Calculates the total price with tax
 */
export function calculateTotal(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
```

### After (Generated Docs)
```markdown
## API Reference

### `calculateTotal(price, taxRate)`

Calculates the total price with tax.

**Parameters:**
- `price` (number): The base price
- `taxRate` (number): The tax rate as a decimal (e.g., 0.08 for 8%)

**Returns:** `number` - Total price including tax

**Example:**
```typescript
const total = calculateTotal(100, 0.08);
console.log(total); // 108
```
```

## 🎨 Templates

### Default Template
Professional README with badges, installation, usage, and API sections.

### Minimal Template
Concise documentation for small projects.

### Custom Templates
Create your own templates using the template API (coming soon).

## 🔧 Configuration

### Environment Variables

```bash
# Required for AI features
OPENAI_API_KEY=sk-...

# Optional: Custom OpenAI model
DOCGEN_MODEL=gpt-4-turbo-preview
```

### Config File Options

See [CONFIG.md](./CONFIG.md) for full configuration reference.

## 📊 Use Cases

- **Solo Developers**: Save hours on documentation
- **Teams**: Keep docs in sync across the team
- **Open Source**: Attract contributors with great docs
- **Agencies**: Deliver complete documentation to clients
- **Enterprise**: Maintain consistent documentation standards

## 🗺️ Roadmap

- [ ] HTML output format
- [ ] GitLab/Bitbucket support
- [ ] Live documentation preview
- [ ] Documentation hosting
- [ ] Team collaboration features
- [ ] API documentation as a service

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT © 2026 DocGen AI

## 🆘 Support

- 📧 Email: support@docgen-ai.com
- 💬 Discord: [Join our community](https://discord.gg/docgen-ai)
- 🐛 Issues: [GitHub Issues](https://github.com/awesomejerry/docgen-ai/issues)

## ⭐ Star History

If this project helped you, please consider giving it a ⭐️ on GitHub!

---

**Built with ❤️ for developers who hate writing docs**
