function Tabs({ children, activeTab, onTabChange, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

function TabList({ children }) {
  return (
    <div className="border-b border-border">
      <nav className="flex gap-1 overflow-x-auto">
        {children}
      </nav>
    </div>
  );
}

function Tab({ id, label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick?.(id)}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
        ${isActive
          ? 'border-brand-500 text-brand-400'
          : 'border-transparent text-text-muted hover:text-text-primary'
        }
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}

function TabPanels({ children }) {
  return <div>{children}</div>;
}

function TabPanel({ children, isActive }) {
  if (!isActive) return null;
  return <div className="mt-6">{children}</div>;
}

export { Tabs, TabList, Tab, TabPanels, TabPanel };
