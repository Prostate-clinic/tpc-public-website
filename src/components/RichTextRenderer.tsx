type RichTextRendererProps = {
  html: string;
  className?: string;
};

function sanitizeHtml(input: string) {
  if (!input) return "";

  // Remove dangerous blocks first.
  let cleaned = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)[\s\S]*?>[\s\S]*?<\/(iframe|object|embed|link|meta)>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)[^>]*?>/gi, "");

  // Strip inline event handlers such as onclick, onerror, etc.
  cleaned = cleaned.replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, "");
  cleaned = cleaned.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");

  // Block javascript: URIs.
  cleaned = cleaned.replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");

  return cleaned;
}

export function RichTextRenderer({ html, className }: RichTextRendererProps) {
  const safeHtml = sanitizeHtml(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
