import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ebooksDir = path.join(root, "content/ebooks");

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mdToHtml(text) {
  const lines = text.split("\n");
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    out.push("<table>");
    tableRows.forEach((row, i) => {
      const tag = i === 0 ? "th" : "td";
      out.push("<tr>" + row.map((c) => `<${tag}>${c}</${tag}>`).join("") + "</tr>");
    });
    out.push("</table>");
    tableRows = [];
    inTable = false;
  };

  const flushCode = () => {
    if (!codeBuf.length) return;
    out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
    codeBuf = [];
    inCode = false;
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) flushCode();
      else inCode = true;
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (line.startsWith("|")) {
      flushCode();
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c.replace(/:/g, "")))) continue;
      if (!inTable) inTable = true;
      tableRows.push(cells.map((c) => escapeHtml(c)));
      continue;
    }
    if (inTable) flushTable();

    if (line.startsWith("## Page ")) {
      out.push(`<h2 class="page-head">${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("## ")) {
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith("# ")) {
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith("---")) {
      out.push("<hr />");
    } else if (line.startsWith("- ")) {
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.trim() === "") {
      out.push("<br />");
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushCode();
  flushTable();
  return out.join("\n");
}

function inline(s) {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

const htmlShell = (body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.45; color: #111; }
  h1 { font-size: 22pt; margin: 0 0 8pt; page-break-after: avoid; }
  h2.page-head { font-size: 14pt; color: #c45a00; margin-top: 0; padding-top: 6pt; border-top: 3px solid #c45a00; page-break-before: always; }
  h2.page-head:first-of-type { page-break-before: avoid; border-top: none; }
  h2 { font-size: 13pt; margin: 14pt 0 6pt; }
  h3 { font-size: 11.5pt; margin: 10pt 0 4pt; }
  p, li { margin: 0 0 6pt; }
  pre { background: #f4f4f4; border: 1px solid #ddd; padding: 8pt; font-size: 8.5pt; line-height: 1.35;
    white-space: pre-wrap; word-wrap: break-word; page-break-inside: avoid; }
  code { font-family: Consolas, monospace; font-size: 9pt; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 9.5pt; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; }
  th { background: #f0f0f0; }
  hr { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
</style>
</head>
<body>
${body}
</body>
</html>`;

function buildPdf(slug) {
  const mdPath = path.join(ebooksDir, `${slug}.md`);
  const htmlPath = path.join(ebooksDir, `${slug}-print.html`);
  const pdfPath = path.join(ebooksDir, `${slug}.pdf`);

  if (!existsSync(mdPath)) {
    console.error("Missing:", mdPath);
    return false;
  }

  const md = readFileSync(mdPath, "utf8");
  writeFileSync(htmlPath, htmlShell(mdToHtml(md)), "utf8");

  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  const chrome = chromePaths.find((p) => existsSync(p));
  if (!chrome) {
    console.error("Chrome/Edge not found.");
    return false;
  }

  const result = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { timeout: 120000 },
  );

  if (result.status !== 0) {
    console.error("Failed:", slug, result.stderr?.toString());
    return false;
  }
  console.log("PDF:", pdfPath);
  return true;
}

const arg = process.argv[2];
const slugs = arg === "--all"
  ? readdirSync(ebooksDir)
      .filter((f) => f.endsWith(".md") && !f.includes("README"))
      .map((f) => f.replace(/\.md$/, ""))
  : [arg || "customer-support-chatgpt-prompts"];

let ok = 0;
for (const slug of slugs) {
  if (buildPdf(slug)) ok++;
}
console.log(`Done: ${ok}/${slugs.length} PDFs`);
