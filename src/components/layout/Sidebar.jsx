import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  FaFlask,
  FaHome,
  FaSearch,
  FaThLarge,
  FaUpload,
  FaAngleLeft,
  FaAngleRight,
} from 'react-icons/fa';

const NavItem = ({ to, icon, isCollapsed, children, onClick }) => (
  <NavLink
    to={to}
    end
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center h-12  mx-2 px-4 
      transition-all duration-200 ease-in-out
      ${isCollapsed ? 'justify-center' : 'justify-start'}
      ${
        isActive
          ? 'bg-primary text-white shadow-sm'
          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
      }
    `}
  >
    {/* Icon - Always visible */}
    <div className="flex-shrink-0 flex items-center justify-center w-5">
      {icon}
    </div>
    {/* Text - Fades out when collapsed */}
    <span
      className={`
        ml-3 font-medium whitespace-nowrap 
        transition-all duration-200
        ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}
      `}
    >
      {children}
    </span>
  </NavLink>
);

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
  const closeSidebar = () => setIsOpen(false);

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40
        flex flex-col
        bg-white 
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Logo Section */}
      <div className={`
        flex items-center h-20 border-b border-gray-200
        transition-all duration-300
        ${isCollapsed ? 'justify-center px-2' : 'px-6'}
      `}>
        <Link to="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex-shrink-0">
            <FaFlask className="h-8 w-8 text-primary" />
          </div>
          <span className={`
            text-2xl font-bold text-gray-800 whitespace-nowrap
            transition-all duration-300
            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
          `}>
            Lab<span className="text-primary">Analysis</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        <NavItem 
          to="/" 
          icon={<FaHome size={20} />} 
          isCollapsed={isCollapsed} 
          onClick={closeSidebar}
        >
          Home
        </NavItem>
        <NavItem 
          to="/dashboard" 
          icon={<FaThLarge size={20} />} 
          isCollapsed={isCollapsed} 
          onClick={closeSidebar}
        >
          Dashboard
        </NavItem>
        <NavItem 
          to="/upload" 
          icon={<FaUpload size={20} />} 
          isCollapsed={isCollapsed} 
          onClick={closeSidebar}
        >
          Upload Data
        </NavItem>
        <NavItem 
          to="/extract" 
          icon={<FaSearch size={20} />} 
          isCollapsed={isCollapsed} 
          onClick={closeSidebar}
        >
          Extract
        </NavItem>
      </nav>

      {/* Collapse Toggle - Always Visible on Desktop */}
      <div className="hidden lg:block border-t border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            w-full h-14 flex items-center justify-center
            text-gray-600 hover:text-primary hover:bg-gray-50
            transition-colors duration-200
            ${isCollapsed ? 'px-2' : 'px-6'}
          `}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="flex items-center space-x-3">
            {/* Icon - Always visible */}
            <div className="flex-shrink-0">
              {isCollapsed ? (
                <FaAngleRight size={20} className="transition-transform duration-200" />
              ) : (
                <FaAngleLeft size={20} className="transition-transform duration-200" />
              )}
            </div>
            {/* Text - Fades out when collapsed */}
            <span className={`
              font-medium whitespace-nowrap text-sm
              transition-all duration-300
              ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}
            `}>
              Collapse
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}