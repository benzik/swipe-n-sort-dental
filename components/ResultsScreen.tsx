import React, { useState } from 'react';
import { ServiceItem } from '../types';
import { exportToPdf } from '../services/pdfGenerator';
import { ReplayIcon, DownloadIcon, SpinnerIcon } from './Icons';

interface ResultsScreenProps {
  keptItems: ServiceItem[];
  onRestart: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ keptItems, onRestart }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (keptItems.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      await exportToPdf(keptItems);
    } catch (error) {
      console.error("PDF Export failed in UI:", error);
      alert(`Не удалось создать PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  const getServiceCountText = (count: number) => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'услуг';
    }
    if (lastDigit === 1) {
      return 'услугу';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'услуги';
    }
    return 'услуг';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 w-full animate-pop-in">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 text-center">Итоговый список</h1>
        <p className="text-center text-slate-600 mt-2 font-medium">Вы выбрали {keptItems.length} {getServiceCountText(keptItems.length)}.</p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-8">
           <button
            onClick={onRestart}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 transition-all duration-300 transform hover:-translate-y-1"
          >
            <ReplayIcon className="w-5 h-5 mr-2"/>
            Начать заново
          </button>
          <button
            onClick={handleExport}
            disabled={keptItems.length === 0 || isExporting}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:-translate-y-1 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:shadow-md disabled:hover:shadow-lg"
          >
            {isExporting ? (
              <SpinnerIcon className="w-5 h-5 mr-2" />
            ) : (
              <DownloadIcon className="w-5 h-5 mr-2" />
            )}
            {isExporting ? 'Экспорт...' : 'Экспорт в PDF'}
          </button>
        </div>

        <div className="mt-6 max-h-[45vh] overflow-y-auto pr-2 -mr-2 border-t border-slate-200">
          {keptItems.length > 0 ? (
            <ul className="divide-y divide-slate-200/70 mt-4">
              {keptItems.map((item, index) => (
                <li key={`${item.code}-${index}`} className="py-4 px-2">
                  <p className="text-sm font-semibold text-blue-600">{item.code}</p>
                  <p className="text-slate-800 font-medium mt-1">{item.name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-500 py-16 font-semibold">Вы не выбрали ни одной услуги.</p>
          )}
        </div>
      </div>
    </div>
  );
};