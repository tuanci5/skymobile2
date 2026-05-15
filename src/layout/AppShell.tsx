import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { TabType } from '../types';
import { ScrollToTop } from './ScrollToTop';
import { Sidebar } from './Sidebar';

type AppShellProps = {
  activeTab: TabType;
  activeDept: string | null;
  hrSubTab?: string;
  onLogout: () => void;
  user: any;
  allowedTabs: string[];
  isSystemAdmin: boolean;
  routeKey: string;
  children: React.ReactNode;
};

export const AppShell = ({
  activeTab,
  activeDept,
  hrSubTab,
  onLogout,
  user,
  allowedTabs,
  isSystemAdmin,
  routeKey,
  children,
}: AppShellProps) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className={`flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 ${activeTab === 'messenger' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Sidebar
        activeTab={activeTab}
        activeDept={activeDept}
        hrSubTab={hrSubTab}
        onLogout={onLogout}
        user={user}
        allowedTabs={allowedTabs}
        isSystemAdmin={isSystemAdmin}
      />

      <main
        ref={scrollContainerRef}
        className={`flex-1 ${activeTab === 'messenger' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6 lg:p-8'}`}
      >
        <div className={`w-full ${activeTab === 'messenger' ? 'h-full max-w-none' : 'max-w-[1800px] mx-auto'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={routeKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={activeTab === 'messenger' ? 'h-full' : undefined}
            >
              {children}
            </motion.div>
          </AnimatePresence>


        </div>
      </main>

      <ScrollToTop scrollContainerRef={scrollContainerRef} />
    </div>
  );
};
