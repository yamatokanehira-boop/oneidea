"use client";

import React, { useState, KeyboardEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";
import { normalizeTag } from "@/lib/utils";

interface TagInputProps {
  initialTags?: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean; // Add disabled prop
}

export const TagInput: React.FC<TagInputProps> = ({
  initialTags = [],
  onTagsChange,
  placeholder = "例）授業, 旅館, UI",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags);

  React.useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddTag = (tagText: string) => {
    if (disabled) return;
    const newTag = normalizeTag(tagText);
    if (newTag && !tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      onTagsChange(updatedTags);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault(); // Prevent form submission or space insertion
      handleAddTag(inputValue);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (disabled) return;
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    onTagsChange(updatedTags);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs" // Minimal pill style
          >
            #{tag}
            {!disabled && ( // Only show remove button if not disabled
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {!disabled && ( // Only show input and add button if not disabled
        <div className="flex gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="button" onClick={() => handleAddTag(inputValue)} disabled={!inputValue.trim()}>
            追加
          </Button>
        </div>
      )}
    </div>
  );
};
