import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';
import { cn } from '../../lib/utils'; // Assuming you have a cn utility

export default function Switch({ enabled, onChange, srLabel = 'Toggle' }) {
  return (
    <HeadlessSwitch
      checked={enabled}
      onChange={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        enabled ? 'bg-primary' : 'bg-gray-300'
      )}
    >
      <span className="sr-only">{srLabel}</span>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
          'transition duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </HeadlessSwitch>
  );
}