import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { TabType } from '../types';
import { BottomNav } from './BottomNav';

type MobileShellProps = {
  activeTab: TabType;
  routeKey: string;
  unreadCount?: number;
  children: React.ReactNode;
};

export const MobileShell = ({
  activeTab,
  routeKey,
  unreadCount = 0,
  children,
}: MobileShellProps) => {
  const isMessenger = activeTab === 'messenger';

  return (
    <div className={`flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 ${isMessenger ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      <main className={`flex-1 ${isMessenger ? 'overflow-hidden' : 'overflow-y-auto pb-20'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={routeKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={isMessenger ? 'h-full' : undefined}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isMessenger && (
        <BottomNav activeTab={activeTab} unreadCount={unreadCount} />
      )}
    </div>
  );
};
