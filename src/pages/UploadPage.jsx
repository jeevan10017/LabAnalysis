import React, { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { db, storage } from '../config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import * as XLSX from 'xlsx';
import { FaUpload, FaFileExcel, FaInfoCircle } from 'react-icons/fa';

export default function UploadPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid .xlsx or .csv file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to upload data.');
      return;
    }
    if (!file) {
      setError('Please select a file.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for your experiment.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}-${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const fileURL = await getDownloadURL(uploadResult.ref);

      // 2. Parse File (XLSX or CSV)
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // --- NEW SMART PARSER LOGIC ---
          // Read all data, with no headers, skipping the first row (the data itself)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
          
          if (jsonData.length < 3) {
            throw new Error("File must contain at least 2 header rows and 1 data row.");
          }

          const headerRow = jsonData[0];
          const unitRow = jsonData[1];
          const dataRows = jsonData.slice(2);

          const flattenedHeaders = [];
          let currentMainHeader = '';

          headerRow.forEach((header, index) => {
            const mainHeader = (header !== null && !String(header).startsWith('Unnamed')) 
                               ? String(header).trim() 
                               : currentMainHeader;
            
            if (mainHeader) {
                currentMainHeader = mainHeader;
            }
            
            const subHeader = unitRow[index] ? String(unitRow[index]).trim() : '';

            let finalHeader = mainHeader;
            if (subHeader && subHeader.toLowerCase() !== mainHeader.toLowerCase()) {
              finalHeader = `${mainHeader} (${subHeader})`;
            }
            
            flattenedHeaders.push(finalHeader);
          });

          // --- End of Smart Parser ---

          // --- Convert data rows to objects using new headers ---
          const parsedData = dataRows.map(row => {
            const rowObject = {};
            flattenedHeaders.forEach((header, index) => {
              let value = row[index];
              
              if (value === undefined || value === null) {
                rowObject[header] = null;
              } else if (typeof value === 'number') {
                rowObject[header] = value;
              } else if (typeof value === 'string') {
                let trimmedValue = value.trim();
                if (trimmedValue === '') {
                  rowObject[header] = null;
                } else if (!isNaN(Number(trimmedValue))) {
                  rowObject[header] = Number(trimmedValue);
                } else {
                  rowObject[header] = value;
                }
              } else {
                rowObject[header] = value;
              }
            });
            return rowObject;
          });
          // --- End of data conversion ---

          // 3. Save experiment data to Firestore
          const docRef = await addDoc(collection(db, 'experiments'), {
            userId: user.uid,
            authorName: user.displayName || user.email,
            title: title.trim(),
            description: description.trim(),
            isPublic: isPublic,
            fileURL: fileURL,
            headers: flattenedHeaders, // <-- Save the new flattened headers
            data: parsedData,
            createdAt: Timestamp.now(),
            analysis: {
              calculations: [],
              models: [] 
            }
          });
          
          setIsLoading(false);
          navigate(`/dashboard?uploadSuccess=true`);
        } catch (parseError) {
          console.error("Error parsing file:", parseError);
          setError(`Error processing file: ${parseError.message}`);
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);

    } catch (uploadError) {
      console.error("Error uploading file:", uploadError);
      setError(`Failed to upload file: ${uploadError.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">Upload New Experiment Data</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Experiment Title
            </label>
            <input
              type="text"
              id="title"
              className="mt-1 block w-full rounded-md border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., JSL SAF01 Data (Apr-22 to Feb-23)"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows="3"
              className="mt-1 block w-full rounded-md border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief description of your experiment, methods, or objectives."
            ></textarea>
          </div>

          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
              Upload .xlsx File
            </label>
            <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-secondary-DEFAULT px-6 pt-5 pb-6">
              <div className="space-y-1 text-center">
                <FaFileExcel className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".xlsx,.csv"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">.xlsx or .csv files are supported</p>
                {file && (
                  <p className="mt-2 text-sm text-gray-700">Selected file: <span className="font-medium">{file.name}</span></p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="isPublic"
              name="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-secondary-DEFAULT text-primary focus:ring-primary"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
              Make this experiment public
            </label>
            <span className="ml-2 text-sm text-gray-500">
              <FaInfoCircle className="inline-block mr-1" /> Public experiments can be viewed by anyone.
            </span>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading || !file || !title.trim()}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" /> Uploading & Processing...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" /> Upload Data
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}