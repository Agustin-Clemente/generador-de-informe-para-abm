
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';

interface PdfDropzoneProps {
  onFileDrop: (file: File) => void;
}

const PdfDropzone: React.FC<PdfDropzoneProps> = ({ onFileDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        onFileDrop(file);
      } else {
        setError('Invalid file type. Please upload a PDF.');
      }
    }
  }, [onFileDrop]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        onFileDrop(file);
      } else {
        setError('Invalid file type. Please upload a PDF.');
      }
    }
  };
  
  const openFileDialog = () => {
    if(fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const borderStyle = isDragging 
    ? 'border-brand-secondary' 
    : 'border-gray-300';

  return (
    <div className="w-full">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden"
            accept="application/pdf"
        />
        <div
        className={`relative w-full p-10 text-center border-4 border-dashed ${borderStyle} rounded-xl transition-colors duration-300 cursor-pointer hover:border-brand-secondary bg-gray-50`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        >
        <div className="flex flex-col items-center justify-center text-gray-500">
            <UploadIcon className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-xl font-semibold">
            Arrastra el FTW o <span className="text-brand-secondary">click para subirlo</span>
            </p>
            <p className="mt-1 text-sm">El documento será analizado</p>
        </div>
        </div>
        {error && <p className="mt-4 text-center text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default PdfDropzone;
