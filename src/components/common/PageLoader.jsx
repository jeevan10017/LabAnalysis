import React from 'react';
import Spinner from './Spinner';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center w-full h-[60vh]">
      <Spinner />
    </div>
  );
}