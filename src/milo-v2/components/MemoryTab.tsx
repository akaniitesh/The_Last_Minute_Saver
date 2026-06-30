import { useState } from "react";
import { useMilo } from "../context/useMilo";
import { BrainCircuit, Trash2, Plus, Tag, Search, Sparkles } from "lucide-react";
import { MemoryCategory } from "../types/memory";

export default function MemoryTab() {
  const { state, addFactMemory, deleteFactMemory } = useMilo();
  const [newMemory, setNewMemory] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("user_preference");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const entries = state.memory.entries || [];

  const handleAdd = () => {
    if (!newMemory.trim()) return;
    addFactMemory(newMemory, category);
    setNewMemory("");
  };

  const filteredEntries = entries.filter((m) => {
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "all" || m.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const displayCategoryLabel = (cat: MemoryCategory) => {
    switch (cat) {
      case "user_preference":
        return "preference";
      case "task_context":
        return "rule";
      case "system_log":
        return "log";
      case "summary":
        return "summary";
      default:
        return cat;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs">
      
      {/* Upper header section */}
      <div className="bg-gray-50 border-b border-gray-150 p-3 px-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <BrainCircuit size={13} className="text-indigo-600 animate-pulse" />
            <span>Milo Memory Vault</span>
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Persisted facts, scheduling constraints, and personal rules.</p>
        </div>
        <div className="bg-white px-2 py-0.5 rounded-lg border border-gray-200 text-[9px] font-mono font-bold text-gray-500 uppercase">
          {entries.length} Nodes
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFCFC] min-h-0">
        
        {/* ADD MEMORY MANUAL FORM */}
        <div className="bg-white border border-gray-150 p-3 rounded-2xl shadow-4xs space-y-2.5">
          <h4 className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Add New Memory Node</h4>
          <textarea
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="e.g., 'I prefer writing milestones in early morning hours before meetings.'"
            className="w-full h-14 bg-gray-50 border border-gray-150 rounded-xl p-2.5 text-xs font-sans outline-hidden focus:border-indigo-400 focus:bg-white resize-none"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1 px-1.5">
              <span className="text-[9px] font-mono text-gray-400 font-bold uppercase mr-1">Type:</span>
              {(["user_preference", "fact", "task_context", "summary"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    category === cat
                      ? "bg-black text-white shadow-3xs"
                      : "text-gray-400 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  {displayCategoryLabel(cat)}
                </button>
              ))}
            </div>

            <button
              onClick={handleAdd}
              disabled={!newMemory.trim()}
              className="ml-auto p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-4xs">
              <Search size={12} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search facts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-hidden text-xs text-gray-700 flex-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setSelectedCategoryFilter("all")}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase border cursor-pointer shrink-0 transition-all ${
                selectedCategoryFilter === "all"
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-400 border-gray-200 hover:text-black"
              }`}
            >
              All Types
            </button>
            {(["user_preference", "fact", "task_context", "summary"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase border cursor-pointer shrink-0 transition-all ${
                  selectedCategoryFilter === cat
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-400 border-gray-200 hover:text-black"
                }`}
              >
                {displayCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* FACT LIST */}
        <div className="space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center p-6 bg-white border border-dashed border-gray-200 rounded-2xl">
              <p className="text-[10px] text-gray-400">Zero memory nodes found. Click "Add New Memory" above or chat with Milo to save some user contexts.</p>
            </div>
          ) : (
            filteredEntries.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-gray-150 p-3 rounded-2xl flex items-start gap-2.5 group hover:border-gray-200 shadow-5xs transition-all"
              >
                <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                  m.category === "task_context"
                    ? "bg-red-50 text-red-600 border-red-100"
                    : m.category === "user_preference"
                    ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                    : "bg-gray-50 text-gray-600 border-gray-100"
                }`}>
                  <Tag size={12} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-800 leading-normal block font-sans break-words">{m.content}</span>
                  <span className="text-[8px] font-mono text-gray-400 block mt-1 uppercase tracking-wider font-bold">
                    {displayCategoryLabel(m.category)}
                  </span>
                </div>

                <button
                  onClick={() => deleteFactMemory(m.id)}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg cursor-pointer transition-colors"
                  title="Wipe Memory Node"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
