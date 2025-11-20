import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Switch({ enabled, onChange, srLabel = 'Toggle', disabled = false }) {
  return (
    <HeadlessSwitch
      checked={enabled}
      onChange={onChange}
      disabled={disabled}
      className={classNames(
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        enabled ? 'bg-primary' : 'bg-gray-300',
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      <span className="sr-only">{srLabel}</span>
      <span
        aria-hidden="true"
        className={classNames(
          enabled ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </HeadlessSwitch>
  );
}