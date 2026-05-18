const TABS = [
  { id: "swipe", label: "Swipe" },
  { id: "results", label: "Results" },
  { id: "matches", label: "Matches" },
];

export default function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {TABS.map((tab) => (
        <button
          className={activeTab === tab.id ? "active" : ""}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
