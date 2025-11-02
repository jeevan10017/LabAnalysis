import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaImage, FaUpload } from 'react-icons/fa';
import { createWorker } from 'tesseract.js';
import Spinner from '../common/Spinner';

// This is a basic parser. It splits by newline, then by spaces or tabs.
const parseOcrText = (text) => {
  const rows = text.split('\n').filter(row => row.trim() !== '');
  const data = rows.map(row => row.split(/\s+/).filter(cell => cell.trim() !== ''));
  
  if (data.length === 0) return { columns: [], data: [] };

  // Assume first row is headers, rest is data
  const headers = data[0] || [];
  const body = data.slice(1);

  // Create column objects
  const columns = headers.map((name, i) => ({
    id: `col${i+1}`,
    name: name || `Column ${i+1}`
  }));

  // Ensure all data rows have the same length as the header
  const validData = body.map(row => {
    const newRow = [...row];
    while (newRow.length < columns.length) newRow.push('');
    return newRow.slice(0, columns.length);
  });
  
  return { columns, data: validData };
};


export default function OcrDropzone({ onOcrComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setIsLoading(true);
      setProgress(0);
      
      // --- FIX: Pass the logger to createWorker, not recognize ---
      // 1. Define the logger function here.
      const logger = (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      }
      
      // 2. Pass 'eng' as the language, '1' as OEM, and the logger in the options object.
      const worker = await createWorker('eng', 1, {
        logger,
      });
      // --- END OF FIX ---

      try {
        // 3. Call recognize *without* the logger.
        const { data: { text } } = await worker.recognize(file);
        
        // Parse the text and pass it to the parent
        const { columns, data } = parseOcrText(text);
        onOcrComplete({ columns, data, imageFile: file });
        
        await worker.terminate();
      } catch (err) {
        console.error(err);
        alert("OCR failed. Please try again or enter data manually.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [onOcrComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: false
  });

  return (
    <div className="w-full bg-white p-6 shadow rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Upload Handwritten Data Image
      </h3>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Spinner />
          <p className="text-lg font-semibold text-primary-dark mt-4">Scanning Image...</p>
          <p className="text-sm text-secondary-dark mt-1">{progress > 0 && `${progress}%`}</p>
        </div>
      ) : (
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
                  Drop your image here...
                </p>
              </>
            ) : (
              <>
                <FaImage className="h-16 w-16 text-gray-400" />
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    Drag & drop your image
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse (.png, .jpg)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-3">
        For best results, use a clear image of a table with a light background.
      </p>
    </div>
  );
}