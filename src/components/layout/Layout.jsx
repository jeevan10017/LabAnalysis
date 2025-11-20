import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useLayoutStore } from '../../hooks/useLayoutStore';

export default function Layout({ children }) {
  // Use global store instead of local state
  const { sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed } = useLayoutStore();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-margin duration-300 ease-in-out
          ${isCollapsed ? 'lg:ml-20' : 'lg:ml-60'}
        `}
      >
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          {/* Removed fixed max-w container here to allow pages to control their own width */}
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}