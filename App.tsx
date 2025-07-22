import React, { useState, useEffect } from 'react';
import { ALL_SERVICES } from './constants';
import { ServiceItem } from './types';
import { SwipeableCard } from './components/SwipeableCard';
import { ResultsScreen } from './components/ResultsScreen';
import { CheckIcon, CrossIcon, UndoIcon } from './components/Icons';

const App: React.FC = () => {
  const [services, setServices] = useState(() => ALL_SERVICES);
  const [currentIndex, setCurrentIndex] = useState(0); // Start from the beginning
  const [keptItems, setKeptItems] = useState<ServiceItem[]>([]);
  const [swipedDirection, setSwipedDirection] = useState<'left' | 'right' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [key, setKey] = useState(Date.now());
  const [history, setHistory] = useState<('left' | 'right')[]>([]);
  const [undoAnimation, setUndoAnimation] = useState<'left' | 'right' | null>(null);

  const totalServices = services.length;

  // Effect to reset the undo animation trigger after it has been consumed
  useEffect(() => {
    if (undoAnimation) {
      const timer = setTimeout(() => setUndoAnimation(null), 50);
      return () => clearTimeout(timer);
    }
  }, [undoAnimation]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= totalServices || swipedDirection) return;
    
    setUndoAnimation(null); // Ensure no undo animation is triggered on a regular swipe
    setHistory(prev => [...prev, direction]);
    setSwipedDirection(direction);

    // Add a small delay to allow the card to animate out
    setTimeout(() => {
      if (direction === 'right') {
        setKeptItems(prev => [...prev, services[currentIndex]]);
      }
      
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= totalServices) {
        setIsFinished(true);
      } else {
        setCurrentIndex(nextIndex);
        setSwipedDirection(null); // Reset for the next card
      }
    }, 300);
  };

  const handleUndo = () => {
    if (history.length === 0 || swipedDirection !== null) return;

    const lastDirection = history[history.length - 1];

    setUndoAnimation(lastDirection); // This will trigger the animation on the card that becomes current

    if (lastDirection === 'right') {
        setKeptItems(prev => prev.slice(0, -1));
    }

    setHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
  };
  
  const handleRestart = () => {
    setKey(Date.now());
    setServices(ALL_SERVICES);
    setKeptItems([]);
    setCurrentIndex(0);
    setIsFinished(false);
    setSwipedDirection(null);
    setHistory([]);
    setUndoAnimation(null);
  };

  const progressPercentage = (currentIndex / totalServices) * 100;

  return (
    <div key={key} className="w-screen h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden antialiased">
      {isFinished ? (
        <ResultsScreen keptItems={keptItems} onRestart={handleRestart} />
      ) : (
        <div className="w-full max-w-sm h-full flex flex-col justify-center items-center">
            {/* Header */}
            <div className="w-full mb-6 text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <h1 className="text-2xl font-bold text-slate-800">Выберите услуги</h1>
                <p className="text-slate-500 font-medium mt-1">{Math.min(currentIndex + 1, totalServices)} из {totalServices}</p>
                 <div className="w-full bg-slate-200 rounded-full h-2 mt-3 shadow-inner">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-out' }}></div>
                </div>
            </div>

            {/* Card Stack */}
            <div className="relative w-full h-[450px] md:h-[500px] flex-grow max-h-[500px]">
              {services.length > 0 && currentIndex < totalServices ? (
                services.map((service, index) => {
                  const isCurrent = index === currentIndex;
                  if (index < currentIndex || index > currentIndex + 3) return null; // Don't render cards that are already swiped or too deep in the stack

                  return (
                    <SwipeableCard
                      key={service.code + '-' + key}
                      service={service}
                      onSwipe={handleSwipe}
                      isCurrent={isCurrent}
                      stackIndex={index - currentIndex}
                      swipedDirection={isCurrent ? swipedDirection : null}
                      animateInFrom={isCurrent ? undoAnimation : null}
                    />
                  );
                }).reverse() // Render from last to first so top card is last in DOM
              ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg">
                    <p className="text-slate-500 font-semibold text-lg">Загрузка...</p>
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex-shrink-0 mt-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="flex justify-center items-center space-x-4">
                    <button
                        onClick={() => handleSwipe('left')}
                        className="flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-xl text-red-500 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:scale-100"
                        aria-label="Отклонить"
                        disabled={swipedDirection !== null}
                    >
                        <CrossIcon className="w-10 h-10"/>
                    </button>
                    <button
                        onClick={handleUndo}
                        className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg text-slate-500 hover:bg-slate-100 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                        aria-label="Отменить"
                        disabled={history.length === 0 || swipedDirection !== null}
                    >
                        <UndoIcon className="w-8 h-8"/>
                    </button>
                     <button
                        onClick={() => handleSwipe('right')}
                        className="flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-xl text-green-500 hover:bg-green-50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:scale-100"
                        aria-label="Принять"
                        disabled={swipedDirection !== null}
                    >
                        <CheckIcon className="w-10 h-10"/>
                    </button>
                </div>
                 <p className="text-center text-slate-400 mt-4 text-sm font-medium">Смахните или используйте кнопки</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
