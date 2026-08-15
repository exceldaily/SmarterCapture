"use client";

import { useId, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ label, value, rows = 10 }: { label: string; value: string; rows?: number }) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="admin-copy-field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} readOnly rows={rows} />
      <button type="button" onClick={copyValue}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy to clipboard"}
      </button>
    </div>
  );
}
