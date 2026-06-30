import React, { useContext } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { CATEGORIES } from "../utils/constants";

export const MapToolbar: React.FC = () => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const { setSearchQuery } = context;

  const quickSearches = [
    { label: "ATM", emoji: "🏧" },
    { label: "Restaurant", emoji: "🍽️" },
    { label: "Coffee", emoji: "☕" },
    ...CATEGORIES.map((c) => ({ label: c.name, emoji: c.emoji })),
  ];

  return (
    <div id="quick-category-toolbar" className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none shrink-0 z-30">
      {quickSearches.map((item, idx) => (
        <button
          key={idx}
          onClick={() => setSearchQuery(item.label)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 active:bg-neutral-100 rounded-full text-xs font-semibold text-neutral-700 shadow-md border border-neutral-150 transition-all shrink-0 hover:scale-105"
        >
          <span>{item.emoji}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
export default MapToolbar;
