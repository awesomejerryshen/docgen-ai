"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMarkdown = formatMarkdown;
exports.markdownToHtml = markdownToHtml;
exports.generateBadgeHtml = generateBadgeHtml;
const marked_1 = require("marked");
const highlight_js_1 = __importDefault(require("highlight.js"));
function formatMarkdown(content) {
    return content.trim();
}
async function markdownToHtml(markdown, title = 'Documentation') {
    const renderer = new marked_1.marked.Renderer();
    renderer.code = function ({ text, lang }) {
        let highlighted = text;
        if (lang && highlight_js_1.default.getLanguage(lang)) {
            try {
                highlighted = highlight_js_1.default.highlight(text, { language: lang }).value;
            }
            catch {
                highlighted = text;
            }
        }
        else {
            try {
                highlighted = highlight_js_1.default.highlightAuto(text).value;
            }
            catch {
                highlighted = text;
            }
        }
        return `<pre><code class="hljs ${lang || ''}">${escapeHtml(highlighted)}</code></pre>`;
    };
    marked_1.marked.setOptions({ renderer });
    const htmlContent = await (0, marked_1.marked)(markdown);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background: #fafafa;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #1a1a1a;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.3em;
    }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Consolas, monospace;
    }
    pre {
      background: #282c34;
      color: #abb2bf;
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    blockquote {
      border-left: 4px solid #dfe2e5;
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #6a737d;
      background: #f6f8fa;
      border-radius: 0 4px 4px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #dfe2e5;
      padding: 0.75em;
      text-align: left;
    }
    th {
      background: #f6f8fa;
    }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 2em 0;
    }
    img {
      max-width: 100%;
    }
    ul, ol {
      padding-left: 2em;
    }
    .badge {
      display: inline-block;
      padding: 0.2em 0.5em;
      border-radius: 3px;
      font-size: 0.85em;
      margin-right: 0.3em;
      background: #0366d6;
      color: white;
    }
    @media (max-width: 600px) {
      body { padding: 1rem; }
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function generateBadgeHtml(alt, src, href) {
    const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;
    if (href) {
        return `<a href="${escapeHtml(href)}">${img}</a>`;
    }
    return img;
}
//# sourceMappingURL=formatter.js.map