"use client";

import { students } from "@/lib/mock-data";

const stories = students.slice(0, 6);

function firstName(name: string) {
  return name.split(" ")[0];
}

export function StoryRow() {
  return (
    <div
      className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 py-2"
      aria-label="Stories"
    >
      <div className="flex w-16 shrink-0 flex-col items-center gap-1">
        <div className="story-gradient rounded-full p-[2.5px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-xs font-bold text-text ring-2 ring-surface">
            All
          </div>
        </div>
        <span className="text-[11px] font-medium text-ig-secondary">
          All Hubs
        </span>
      </div>
      {stories.map((s) => (
        <div
          key={s.id}
          className="flex w-16 shrink-0 flex-col items-center gap-1"
        >
          <div className="story-gradient rounded-full p-[2.5px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-xs font-bold text-text ring-2 ring-surface">
              {s.avatarInitials}
            </div>
          </div>
          <span className="w-full truncate text-center text-[11px] font-medium text-ig-secondary">
            {firstName(s.name)}
          </span>
        </div>
      ))}
    </div>
  );
}
