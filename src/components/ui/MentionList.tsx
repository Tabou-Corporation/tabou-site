"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";

interface MemberSuggestion {
  id: string;
  name: string;
  characterId: string | null;
  role: string;
  portrait: string | null;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MemberSuggestion[];
  command: (attrs: { id: string; label: string; characterId: string | null }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command({
            id: item.id,
            label: item.name,
            characterId: item.characterId,
          });
        }
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) {
      return (
        <div className="mention-dropdown">
          <p className="px-3 py-2 text-text-muted text-xs">Aucun membre trouvé</p>
        </div>
      );
    }

    return (
      <div className="mention-dropdown">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`mention-dropdown-item ${index === selectedIndex ? "is-selected" : ""}`}
            onClick={() => selectItem(index)}
          >
            {item.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.portrait}
                alt=""
                width={24}
                height={24}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <span className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center text-2xs text-text-muted flex-shrink-0">
                ?
              </span>
            )}
            <span className="text-sm text-text-primary truncate">{item.name}</span>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = "MentionList";
