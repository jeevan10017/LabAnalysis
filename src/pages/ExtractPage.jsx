import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import PageLoader from '../components/common/PageLoader';
import { Link } from 'react-router-dom';
import { FaEye, FaDownload, FaUser, FaSearch, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import Button from '../components/common/Button';
import { utils, writeFile } from 'xlsx';

const handleDownload = (exp) => {
    const ws = utils.json_to_sheet(exp.data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Data');
    writeFile(wb, `${exp.title || 'experiment'}.xlsx`);
};

const ITEMS_PER_PAGE = 5;

export default function ExtractPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: publicExperiments, isLoading } = useQuery({
    queryKey: ['publicExperiments'],
    queryFn: async () => {
      const q = query(
        collection(db, 'experiments'),
        where('isPublic', '==', true)
      );
      const querySnapshot = await getDocs(q);
      // Filter out any potential bad data
      return querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(exp => exp.title && exp.description && exp.authorName);
    },
  });

  // Client-side filtering
  const filteredExperiments = useMemo(() => {
    if (!publicExperiments) return [];
    return publicExperiments.filter(exp =>
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [publicExperiments, searchTerm]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredExperiments.length / ITEMS_PER_PAGE);
  const currentExperiments = filteredExperiments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="container mx-auto max-w-5xl">
      <h1 className="mb-6 text-3xl font-bold text-secondary-darkest">
        Public Experiment Data
      </h1>
      <p className="mb-6 text-secondary-dark">
        Browse and download processed data from public experiments shared by
        other users.
      </p>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by title, description, or author..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="w-full pl-10 pr-4 py-3  border border-secondary-DEFAULT shadow-sm bg-white focus:ring-primary focus:border-primary"
        />
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {currentExperiments.length > 0 ? (
          currentExperiments.map((exp) => (
            <div
              key={exp.id}
              className="flex flex-col items-start justify-between  bg-white p-6 shadow-sm sm:flex-row sm:items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-primary-dark">
                  {exp.title}
                </h3>
                <p className="mt-1 text-sm text-gray-700">
                  {exp.description}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-secondary-dark">
                  <span className="flex items-center">
                    <FaUser className="mr-1.5" />
                    {exp.authorName || 'Anonymous'}
                  </span>
                  <span>
                    Uploaded:{' '}
                    {new Date(exp.createdAt?.toDate()).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex space-x-2 sm:mt-0 flex-shrink-0">
                <Link to={`/experiment/${exp.id}`}>
                  <Button variant="ghost" aria-label="View">
                    <FaEye />
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => handleDownload(exp)}
                >
                  <FaDownload className="mr-2" /> Download
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white  shadow-sm">
            <p className="text-secondary-dark">
              No experiments found{searchTerm && ' matching your search'}.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center">
          <Button
            variant="secondary"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <FaAngleLeft className="mr-2" /> Previous
          </Button>
          <span className="text-sm text-secondary-dark">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next <FaAngleRight className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}