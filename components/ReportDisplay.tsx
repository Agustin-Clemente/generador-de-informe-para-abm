
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ReportDisplayProps {
  data: ReportData;
  onReset: () => void;
}

const ReportItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-3 px-4 bg-gray-50 rounded-md">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-md text-gray-900 font-semibold break-words">{value || 'N/A'}</dd>
  </div>
);


const ReportDisplay: React.FC<ReportDisplayProps> = ({ data, onReset }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const isCese = !!data.motivoDeCese;

  const handleCopy = () => {
    const mainActionLabel = isCese ? "Motivo de Cese" : "Reemplaza a";
    const mainActionValue = isCese ? data.motivoDeCese : data.reemplazaA;
    const dateLabel = isCese ? "Fecha de Cese" : "Fecha de alta";

    const reportText = `
Informe del Formulario
Nº de Expediente: ${data.expediente}
Establecimiento: ${data.establecimiento}
Teléfono: ${data.telefono}
Delegación: ${data.delegacion}
Repartición: ${data.reparticion}
CUIL: ${data.cuil}
Rol: ${data.rol}
Apellido y Nombre: ${data.apellidoYNombre}
Situación de revista: ${data.situacionDeRevista}
${dateLabel}: ${data.fecha}
Cargo a cubrir: ${data.cargoACubrir}
${mainActionLabel}: ${mainActionValue}
    `.trim().replace(/^\s+/gm, '');

    navigator.clipboard.writeText(reportText).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2500);
    });
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const isCese = !!data.motivoDeCese;
    
    doc.setFontSize(18);
    doc.text("Informe del Formulario", 14, 22);

    const tableData = [
      ["Nº de Expediente", data.expediente],
      ["Establecimiento", data.establecimiento],
      ["Teléfono", data.telefono],
      ["Delegación", data.delegacion],
      ["Repartición", data.reparticion],
      ["CUIL", data.cuil],
      ["Rol", data.rol],
      ["Apellido y Nombre", data.apellidoYNombre],
      ["Situación de revista", data.situacionDeRevista],
      [isCese ? "Fecha de Cese" : "Fecha de alta", data.fecha],
      ["Cargo a cubrir", data.cargoACubrir],
      isCese 
        ? ["Motivo de Cese", data.motivoDeCese] 
        : ["Reemplaza a", data.reemplazaA],
    ].filter(row => row[1]); // Filter out rows with empty values

    autoTable(doc, {
      startY: 30,
      head: [['Campo', 'Valor']],
      body: tableData,
      theme: 'grid',
      styles: {
        cellPadding: 2,
        fontSize: 10,
      },
      headStyles: {
        fillColor: [30, 64, 175], // brand-dark from tailwind config
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' },
      },
    });

    doc.save(`Informe-${data.apellidoYNombre.replace(/\s/g, '_')}-${data.cuil}.pdf`);
  };


  return (
    <div className="w-full animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-brand-dark">
            Informe del Formulario
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                copyStatus === 'copied'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-brand-light text-brand-primary hover:bg-blue-200'
              }`}
            >
              <CopyIcon className="w-5 h-5" />
              <span>{copyStatus === 'copied' ? 'Copiado!' : 'Copiar texto'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 bg-brand-light text-brand-primary hover:bg-blue-200"
            >
              <DownloadIcon className="w-5 h-5" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportItem label="Nº de Expediente" value={data.expediente} />
          <ReportItem label="Establecimiento" value={data.establecimiento} />
          <ReportItem label="Teléfono" value={data.telefono} />
          <ReportItem label="Delegación" value={data.delegacion} />
          <ReportItem label="Repartición" value={data.reparticion} />
          <ReportItem label="CUIL" value={data.cuil} />
          <ReportItem label="Rol" value={data.rol} />
          <ReportItem label="Apellido y Nombre" value={data.apellidoYNombre} />
          <ReportItem label="Situación de revista" value={data.situacionDeRevista} />
          <ReportItem label={isCese ? "Fecha de Cese" : "Fecha de alta"} value={data.fecha} />
          <div className="md:col-span-2 lg:col-span-3">
            <ReportItem label="Cargo a cubrir" value={data.cargoACubrir} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            {isCese ? (
              <ReportItem label="Motivo de Cese" value={data.motivoDeCese} />
            ) : (
              <ReportItem label="Reemplaza a" value={data.reemplazaA} />
            )}
          </div>
        </dl>
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={onReset}
          className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-200"
        >
          Analizar otro FTW
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;