import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Button from '../common/Button';
import { FaBars, FaUserCircle } from 'react-icons/fa';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from '@headlessui/react';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <Button variant="icon" onClick={onMenuClick} aria-label="Open sidebar">
              <FaBars />
            </Button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Menu as="div" className="relative">
                <MenuButton as={Button} variant="icon">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <FaUserCircle className="h-8 w-8 text-gray-400" />
                  )}
                </MenuButton>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-4 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          Log Out
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Transition>
              </Menu>
            ) : (
              <Button onClick={() => navigate('/login')}>
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}