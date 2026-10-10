"use client";

interface HubStoriesProps {
  hubs: string[];
  active: string;
  onSelect: (hub: string) => void;
}

function initials(label: string): string {
  return label
    .split(/[\s·/|-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Circle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-16 shrink-0 flex-col items-center gap-1"
    >
      <span
        className={
          selected
            ? "rounded-full bg-ig-blue p-[2.5px]"
            : "story-gradient rounded-full p-[2.5px]"
        }
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xs font-bold text-ig-text ring-2 ring-white dark:bg-black dark:text-white dark:ring-black">
          {label === "All Hubs" ? "All" : initials(label)}
        </span>
      </span>
      <span className="w-full truncate text-center text-[11px] font-medium text-ig-secondary">
        {label}
      </span>
    </button>
  );
}

export function HubStories({ hubs, active, onSelect }: HubStoriesProps) {
  return (
    <div
      className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 py-2"
      aria-label="Study hubs"
    >
      <Circle
        label="All Hubs"
        selected={active === "All Hubs"}
        onClick={() => onSelect("All Hubs")}
      />
      {hubs.map((hub) => (
        <Circle
          key={hub}
          label={hub}
          selected={active === hub}
          onClick={() => onSelect(hub)}
        />
      ))}
    </div>
  );
}
