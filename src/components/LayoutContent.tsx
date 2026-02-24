import React, { memo, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

const PageLoader = () => (
  <div className="p-6 animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 bg-slate-200 rounded-full w-16" />
            <div className="h-6 bg-slate-200 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LayoutContent = memo(() => (
  <div className="flex-1 overflow-y-auto px-2.5 sm:px-5 pb-5 pt-3 scroll-smooth">
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </div>
));

LayoutContent.displayName = 'LayoutContent';

export default LayoutContent;
