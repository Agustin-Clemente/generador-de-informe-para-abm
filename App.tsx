import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfDropzone from './components/PdfDropzone';
import ReportDisplay from './components/ReportDisplay';
import Loader from './components/Loader';
import { extractDataFromDocumentText } from './services/geminiService';
import { ReportData } from './types';

// Set worker source once for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

const App: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      if (!fullText.trim()) {
          setError('No se pudo extraer la información del PDF. The document might be image-based or corrupted.');
          setIsLoading(false);
          return;
      }

      const data = await extractDataFromDocumentText(fullText);
      setReportData(data);
    } catch (err) {
      console.error(err);
       if (err instanceof Error) {
        if (err.name === 'PasswordException') {
            setError('The PDF is password-protected. Please provide an unlocked document.');
        } else {
            setError('Failed to process the PDF file. It might be corrupted or in an unsupported format.');
        }
      } else {
        setError('An unknown error occurred while processing the PDF.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setReportData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }
    if (error) {
      return (
        <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-bold text-lg mb-2">Ocurrió un error</p>
          <p>{error}</p>
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }
    if (reportData) {
      return <ReportDisplay data={reportData} onReset={handleReset} />;
    }
    return <PdfDropzone onFileDrop={handleFileDrop} />;
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark">
            Generador de informe para ABM
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Sube un documento para confeccionar el informe.
          </p>
        </header>
        <main className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 min-h-[300px] flex items-center justify-center">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-gray-500">
            <p>Realizado por Agustin Clemente</p>
        </footer>
      </div>
    </div>
  );
};

export default App;