import React from 'react';
import Spinner from './Spinner';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center w-full h-[60vh]">
      {/* Use the large spinner style from your example */}
      <div
        className="inline-block h-32 w-32 animate-spin rounded-full border-b-2 border-primary"
        role="status"
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    </div>
  );
}