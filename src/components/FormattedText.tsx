'use client';

import { richTextToHtml } from '@/lib/rich-text';

type FormattedTextProps = {
  text: string;
  className?: string;
};

export default function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text?.trim()) return null;

  return (
    <div
      className={`formatted-text ${className}`}
      dangerouslySetInnerHTML={{ __html: richTextToHtml(text) }}
    />
  );
}
