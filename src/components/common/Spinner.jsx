import React from 'react';

export default function Spinner() {
  return (
    <div
      className="inline-block h-20 w-20 animate-spin rounded-full border-2 border-transparent border-b-primary"
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
}