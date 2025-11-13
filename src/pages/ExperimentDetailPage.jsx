import React, { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Spinner from '../components/common/Spinner';
import { DataGrid } from '../components/visualization/DataGrid';
import Button from '../components/common/Button';
import { DynamicChart } from '../components/visualization/DynamicChart';
import { Listbox } from '@headlessui/react';
import { FaChevronDown, FaPrint, FaDownload, FaInfoCircle, FaFileExcel } from 'react-icons/fa'; // NEW ICON
import { utils, writeFile } from 'xlsx';
import PrintModal from '../components/common/PrintModal'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Switch from '../components/common/Switch';
import PageLoader from '../components/common/PageLoader';

// Select component with new theme
const Select = ({ label, value, onChange, options }) => (
  <Listbox value={value} onChange={onChange}>
    <div className="relative">
      <Listbox.Label className="block text-sm font-medium text-gray-700">{label}</Listbox.Label>
      <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md border border-secondary-DEFAULT bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
        <span className="block truncate">{value || 'Select an option'}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <FaChevronDown className="h-5 w-5 text-gray-400" />
        </span>
      </Listbox.Button>
      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
        {options.map(option => (
          <Listbox.Option
            key={option}
            as={Fragment}
            value={option}
          >
            {({ active, selected }) => (
              <li
                className={`relative cursor-default select-none py-2 pl-4 pr-4 ${
                  active ? 'bg-primary-light text-primary-dark' : 'text-gray-900'
                }`}
              >
                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                  {option}
                </span>
              </li>
            )}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </div>
  </Listbox>
);

const getExperiment = async (id) => {
  if (!id) throw new Error("No experiment ID provided");
  const docRef = doc(db, 'experiments', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Experiment not found");
  }
  return { id: docSnap.id, ...docSnap.data() };
};

export default function ExperimentDetailPage() {
  const { id } = useParams();
  
  const graphRef = useRef();
  const theoryRef = useRef();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: experiment, isLoading, error } = useQuery({
    queryKey: ['experiment', id],
    queryFn: () => getExperiment(id),
    enabled: !!id,
  });

  const { mutate: updateVisibility, isLoading: isUpdating } = useMutation({
    mutationFn: async (newStatus) => {
      const docRef = doc(db, 'experiments', id);
      await updateDoc(docRef, { isPublic: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiment', id] });
      queryClient.invalidateQueries({ queryKey: ['myExperiments'] });
      queryClient.invalidateQueries({ queryKey: ['publicExperiments'] });
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to update status. Please try again.");
    }
  });

  const [xAxisKey, setXAxisKey] = useState('');
  const [yAxisKeys, setYAxisKeys] = useState([]);

  const numericHeaders = useMemo(() => {
    if (!experiment?.data || experiment.data.length === 0) return [];
    const firstRow = experiment.data[0];
    return experiment.headers.filter(h => typeof firstRow[h] === 'number');
  }, [experiment]);

  useEffect(() => {
    if (numericHeaders.length > 0) {
      setXAxisKey(numericHeaders[0]);
      if (numericHeaders.length > 1) {
        setYAxisKeys([numericHeaders[1]]);
      } else {
        setYAxisKeys([numericHeaders[0]]);
      }
    }
  }, [numericHeaders]);

  const handleDownloadXLSX = () => {
    // Open the original uploaded file URL in a new tab for download
    if (experiment?.fileURL) {
      window.open(experiment.fileURL, '_blank');
    } else {
      alert('Original XLSX file not found for download.');
    }
  };

  const handleDownloadCSV = () => {
    const ws = utils.json_to_sheet(experiment.data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Data');
    writeFile(wb, `${experiment.title || 'experiment'}.csv`);
  };

  // --- PROFESSIONAL PDF REPORT GENERATION (FIXED) ---
  const handleGeneratePdf = async ({ includeGraph, includeTable, includeTheory }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let yOffset = 20;
    const margin = 20;
    const pdfWidth = doc.internal.pageSize.getWidth() - (margin * 2);
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper function to add text and manage page breaks
    const addText = (text, size, isBold, color = [0, 0, 0]) => {
      if (yOffset > pageHeight - margin) { doc.addPage(); yOffset = margin; }
      doc.setFontSize(size);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, pdfWidth);
      doc.text(lines, margin, yOffset);
      yOffset += (lines.length * (size * 0.4)) + 5;
    };
    
    // Helper function to add canvas elements
    const addElement = async (element) => {
      if (element) {
        const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        
        const maxGraphHeight = 120;
        let graphWidth = pdfWidth;
        let graphHeight = (imgProps.height * graphWidth) / imgProps.width;
        
        if (graphHeight > maxGraphHeight) {
          graphHeight = maxGraphHeight;
          graphWidth = (imgProps.width * graphHeight) / imgProps.height;
        }
        
        if (yOffset + graphHeight > pageHeight - margin) {
          doc.addPage();
          yOffset = margin;
        }
        
        const xOffset = margin + (pdfWidth - graphWidth) / 2;
        doc.addImage(imgData, 'PNG', xOffset, yOffset, graphWidth, graphHeight);
        yOffset += graphHeight + 15;
      }
    };

    // --- COVER PAGE ---
    addText(experiment.title, 24, true, [0, 121, 107]);
    yOffset += 5;
    addText('Laboratory Experiment Report', 14, false, [100, 100, 100]);
    yOffset += 10;
    doc.setDrawColor(0, 121, 107);
    doc.setLineWidth(0.5);
    doc.line(margin, yOffset, pdfWidth + margin, yOffset);
    yOffset += 15;
    
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'bold');
    doc.text('Author:', margin, yOffset);
    doc.setFont(undefined, 'normal');
    doc.text(experiment.authorName || 'N/A', margin + 35, yOffset);
    yOffset += 8;
    
    doc.setFont(undefined, 'bold');
    doc.text('Date:', margin, yOffset);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(experiment.createdAt?.toDate()).toLocaleDateString(), margin + 35, yOffset);
    yOffset += 8;

    if (experiment.description) {
      yOffset += 10;
      doc.setFont(undefined, 'bold');
      doc.text('Description:', margin, yOffset);
      yOffset += 7;
      addText(experiment.description, 10, false, [80, 80, 80]);
    }
    
    // --- CONTENT PAGE ---
    doc.addPage();
    yOffset = margin;
    
    if (includeGraph && graphRef.current) {
      addText('Data Visualization', 16, true, [0, 121, 107]);
      await addElement(graphRef.current);
    }
    
    const calculations = experiment?.analysis?.calculations || [];
    if (includeTheory && calculations.length > 0) {
      if (yOffset + 30 > pageHeight - margin) { doc.addPage(); yOffset = margin; }
      addText('Analysis & Calculations', 16, true, [0, 121, 107]);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      calculations.forEach((calc, index) => {
        if (yOffset > pageHeight - 30) { doc.addPage(); yOffset = margin; }
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${calc.name}`, margin + 5, yOffset);
        yOffset += 6;
        doc.setFont(undefined, 'normal');
        addText(`Formula: ${calc.formula}`, 10, false, [80, 80, 80]);
        yOffset += 5;
      });
      yOffset += 10;
    }

    if (includeTable) {
      if (yOffset > pageHeight - 60) { doc.addPage(); yOffset = margin; }
      addText('Experimental Data', 16, true, [0, 121, 107]);
      
      // --- PDF TABLE FIX: Use autoTable directly from JSON ---
      autoTable(doc, {
        startY: yOffset,
        head: [experiment.headers],
        body: experiment.data.map(row => experiment.headers.map(header => row[header])),
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 121, 107],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { fontSize: 8, cellPadding: 2 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: margin, right: margin },
      });
      // Update yOffset to be after the table
      yOffset = (doc).lastAutoTable.finalY + 15;
    }
    
    // --- FOOTER ---
    const pageCount = (doc).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pdfWidth / 2 + margin,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 10
      );
    }

    doc.save(`${experiment.title || 'experiment'}_report.pdf`);
  };

  const ExplanationBox = () => {
    const calculations = experiment?.analysis?.calculations || [];
    if (calculations.length === 0) return null;

    return (
      <div ref={theoryRef} className="mt-6 rounded-lg bg-primary-light p-4">
        <h3 className="flex items-center text-lg font-semibold text-primary-dark">
          <FaInfoCircle className="mr-2" /> Analysis & Calculations
        </h3>
        <p className="mt-1 text-sm text-primary-dark/80">
          The following derived values were calculated:
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          {calculations.map(calc => (
            <li key={calc.id} className="text-sm text-primary-dark">
              <strong>{calc.name}:</strong> {calc.formula}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (isLoading) return <PageLoader />;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <>
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{experiment.title}</h1>
            <p className="mt-1 text-secondary-dark">{experiment.description}</p>
            <div className="mt-4 flex items-center space-x-3">
              <Switch
                enabled={experiment.isPublic}
                onChange={updateVisibility}
                srLabel="Toggle experiment visibility"
              />
              <span className="text-sm font-medium text-gray-700">
                {experiment.isPublic ? 'Public' : 'Private'}
              </span>
              {isUpdating && <Spinner />}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 sm:mt-0"> {/* Use flex-wrap and gap */}
            {experiment?.fileURL && (
                <Button variant="secondary" onClick={handleDownloadXLSX}>
                    <FaFileExcel className="mr-2" /> Original .xlsx
                </Button>
            )}
            <Button variant="secondary" onClick={handleDownloadCSV}>
              <FaDownload className="mr-2" /> Extract (.csv)
            </Button>
            <Button onClick={() => setIsPrintModalOpen(true)}>
              <FaPrint className="mr-2" /> Generate Report
            </Button>
          </div>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Data Visualization</h2>
          
          <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="X-Axis"
              value={xAxisKey}
              onChange={setXAxisKey}
              options={numericHeaders}
            />
            <Select
              label="Y-Axis"
              value={yAxisKeys[0] || ''} 
              onChange={(val) => setYAxisKeys([val])}
              options={numericHeaders.filter(h => h !== xAxisKey)}
            />
          </div>
          
          <div ref={graphRef} className="w-full aspect-video">
            <DynamicChart
              data={experiment.data}
              xAxisKey={xAxisKey}
              yAxisKeys={yAxisKeys}
            />
          </div>
        </div>
        
        {experiment?.analysis?.calculations?.length > 0 && <ExplanationBox />}

        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Full Data Table</h2>
          <div className="mt-4 overflow-x-auto">
            <DataGrid
              data={experiment.data}
              columns={experiment.headers.map(h => ({ header: h, accessorKey: h }))}
            />
          </div>
        </div>
      </div>

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onGeneratePdf={handleGeneratePdf}
      />
    </>
  );
}