import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFileExcel, FaUpload } from 'react-icons/fa';

export default function FileDropzone({ onFileAccepted }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="w-full bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Upload Your Data File
      </h3>
      
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive 
            ? 'border-primary bg-primary-light' 
            : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary-light/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isDragActive ? (
            <>
              <FaUpload className="h-16 w-16 text-primary animate-bounce" />
              <p className="text-lg font-semibold text-primary-dark">
                Drop your file here...
              </p>
            </>
          ) : (
            <>
              <FaFileExcel className="h-16 w-16 text-gray-400" />
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  Drag & drop your file here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Supported formats:</span>
                <span className="font-medium text-primary">.xlsx</span>
                <span className="font-medium text-primary">.xls</span>
                <span className="font-medium text-primary">.csv</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Maximum file size: 10MB
      </p>
    </div>
  );
}