"use client";

import { Button } from "@/components/ui/button";
import { SortOrder } from "@/lib/types"; // SortOrder型をインポート

interface SortOrderSelectorProps {
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
}

export function SortOrderSelector({ sortOrder, setSortOrder }: SortOrderSelectorProps) {
  return (
    <div className="space-y-2 border-t border-border mt-4 pt-4">
      <p className="text-sm font-medium text-gray-700">並び替え</p>
      <div className="grid grid-cols-4 bg-gray-100 rounded-lg p-1 gap-1 border border-gray-200">
        <Button
          className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'newest' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
          onClick={() => setSortOrder('newest')}
        >
          新しい順
        </Button>
        <Button
          className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'oldest' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
          onClick={() => setSortOrder('oldest')}
        >
          古い順
        </Button>
        <Button
          className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'progress_high' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
          onClick={() => setSortOrder('progress_high')}
        >
          育成％高
        </Button>
        <Button
          className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'progress_low' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
          onClick={() => setSortOrder('progress_low')}
        >
          育成％低
        </Button>
      </div>
    </div>
  );
}
