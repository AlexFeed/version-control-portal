import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  readStoredPinnedTabs,
  writeStoredPinnedTabs,
  readHiddenCoreTabs,
  writeHiddenCoreTabs,
  type PinnedTab,
} from './pinnedTabsStorage';

export type { PinnedTab };

interface PinnedTabsContextValue {
  pinnedTabs: PinnedTab[];
  isPinned: (key: string) => boolean;
  togglePin: (tab: PinnedTab) => void;
  isCoreHidden: (key: string) => boolean;
  toggleCoreVisibility: (key: string) => void;
}

const PinnedTabsContext = createContext<PinnedTabsContextValue | undefined>(undefined);

export function PinnedTabsProvider({ children }: { children: ReactNode }) {
  const [pinnedTabs, setPinnedTabs] = useState<PinnedTab[]>(() => readStoredPinnedTabs());
  const [hiddenCoreKeys, setHiddenCoreKeys] = useState<string[]>(() => readHiddenCoreTabs());

  const isPinned = (key: string) => pinnedTabs.some(tab => tab.key === key);

  const togglePin = (tab: PinnedTab) => {
    setPinnedTabs(prev => {
      const next = prev.some(t => t.key === tab.key) ? prev.filter(t => t.key !== tab.key) : [...prev, tab];
      writeStoredPinnedTabs(next);
      return next;
    });
  };

  const isCoreHidden = (key: string) => hiddenCoreKeys.includes(key);

  const toggleCoreVisibility = (key: string) => {
    setHiddenCoreKeys(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      writeHiddenCoreTabs(next);
      return next;
    });
  };

  return (
    <PinnedTabsContext.Provider value={{ pinnedTabs, isPinned, togglePin, isCoreHidden, toggleCoreVisibility }}>
      {children}
    </PinnedTabsContext.Provider>
  );
}

export function usePinnedTabs(): PinnedTabsContextValue {
  const context = useContext(PinnedTabsContext);
  if (!context) throw new Error('usePinnedTabs must be used within PinnedTabsProvider');
  return context;
}
