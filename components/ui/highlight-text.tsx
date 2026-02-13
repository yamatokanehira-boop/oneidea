"use client";

import React from 'react';
import { cn } from '@/lib/utils'; // cn function for tailwind-merge/clsx

interface HighlightTextProps {
  text: string;
  highlight?: string | string[]; // Single string or array of strings to highlight
  className?: string; // Additional classes for the container
  highlightClassName?: string; // Classes for the highlighted parts
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  highlight,
  className,
  highlightClassName = "bg-gray-300 dark:bg-gray-600 bg-opacity-50", // Default highlight style (darker gray)
}) => {
  if (!highlight || highlight.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const highlightTerms = Array.isArray(highlight)
    ? highlight.filter(term => term.trim() !== '').map(term => term.toLowerCase())
    : [highlight].filter(term => term.trim() !== '').map(term => term.toLowerCase());

  if (highlightTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  };

  // Create a regex to find all highlight terms, case-insensitive
  const pattern = new RegExp(`(${highlightTerms.map(escapeRegExp).join('|')})`, 'gi');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  text.replace(pattern, (match, p1, offset) => {
    // Add the part before the match
    if (offset > lastIndex) {
      parts.push(text.substring(lastIndex, offset));
    }
    // Add the highlighted part
    parts.push(
      <span key={offset} className={cn(highlightClassName)}>
        {match}
      </span>
    );
    lastIndex = offset + match.length;
    return match; // Return match to satisfy replace callback
  });

  // Add any remaining part after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};
