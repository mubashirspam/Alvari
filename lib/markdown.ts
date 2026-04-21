const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => ESCAPE[char] ?? char);
}

function renderInline(line: string): string {
  let out = escapeHtml(line);
  out = out.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-medium text-[var(--color-ink)]">$1</strong>',
  );
  out = out.replace(
    /(^|[^*])\*([^*\n]+)\*/g,
    '$1<em class="italic">$2</em>',
  );
  out = out.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-[var(--color-bg-soft)] px-1.5 py-0.5 text-[0.92em] font-mono">$1</code>',
  );
  return out;
}

type Block =
  | { kind: "h2" | "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "p"; text: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ kind: "h3", text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !/^-\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", text: paraLines.join(" ") });
  }

  return blocks;
}

export function renderMarkdown(markdown: string): string {
  const blocks = parseBlocks(markdown);
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "h2":
          return `<h3 class="mt-10 font-serif text-[26px] font-normal leading-tight tracking-[-0.02em] text-[var(--color-ink)]">${renderInline(block.text)}</h3>`;
        case "h3":
          return `<h4 class="mt-7 text-[15px] font-medium uppercase tracking-[0.12em] text-[var(--color-accent)]">${renderInline(block.text)}</h4>`;
        case "ul":
          return `<ul class="mt-4 space-y-2 pl-5 text-[15px] font-light leading-[1.75] text-[var(--color-muted)] [list-style:disc]">${block.items
            .map((item) => `<li>${renderInline(item)}</li>`)
            .join("")}</ul>`;
        case "ol":
          return `<ol class="mt-4 space-y-2 pl-5 text-[15px] font-light leading-[1.75] text-[var(--color-muted)] [list-style:decimal]">${block.items
            .map((item) => `<li>${renderInline(item)}</li>`)
            .join("")}</ol>`;
        case "p":
          return `<p class="mt-4 text-[15px] font-light leading-[1.8] text-[var(--color-muted)]">${renderInline(block.text)}</p>`;
      }
    })
    .join("\n");
}
