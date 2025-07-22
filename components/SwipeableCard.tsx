import React, { useState, useRef, useEffect } from 'react';
import { ServiceItem } from '../types';

interface SwipeableCardProps {
  service: ServiceItem;
  onSwipe: (direction: 'left' | 'right') => void;
  isCurrent: boolean;
  stackIndex: number;
  swipedDirection: 'left' | 'right' | null;
  animateInFrom: 'left' | 'right' | null;
}

const SWIPE_THRESHOLD = 100; // pixels to trigger swipe
const MAX_ROTATION = 15; // degrees

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ service, onSwipe, isCurrent, stackIndex, swipedDirection, animateInFrom }) => {
  const [style, setStyle] = useState({});
  const [feedback, setFeedback] = useState({ opacity: 0, direction: null as 'left' | 'right' | null, text: '' });
  const [isExpanded, setIsExpanded] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Undo animation effect
    if (isCurrent && animateInFrom && cardContentRef.current) {
      const cardEl = cardContentRef.current;
      
      // 1. Position card off-screen without a transition
      cardEl.style.transition = 'none';
      const initialX = (animateInFrom === 'right' ? 1 : -1) * (window.innerWidth + 200);
      const initialRotate = (animateInFrom === 'right' ? 1 : -1) * MAX_ROTATION * 1.5;
      cardEl.style.transform = `translateX(${initialX}px) rotate(${initialRotate}deg)`;

      const onTransitionEnd = () => {
        // Sync React's state with the DOM state after the animation finishes
        setStyle({ transform: 'translateX(0px) rotate(0deg) scale(1)' });
      };
      cardEl.addEventListener('transitionend', onTransitionEnd, { once: true });

      // 2. In the next frame, apply the transition and animate to the center
      requestAnimationFrame(() => {
        cardEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        cardEl.style.transform = 'translateX(0px) rotate(0deg) scale(1)';
      });

      // Cleanup listener in case the component unmounts mid-animation
      return () => {
        cardEl.removeEventListener('transitionend', onTransitionEnd);
      };
    }
  }, [isCurrent, animateInFrom]);

  const getStackStyle = () => {
    if (!isCurrent) {
        const yOffset = stackIndex * 10;
        const scale = 1 - stackIndex * 0.05;
        return {
            transform: `translateY(${yOffset}px) scale(${scale})`,
            transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s',
            opacity: stackIndex < 3 ? 1 : 0, // Only show top 3 cards in stack
        };
    }
    return {};
  };

  const updateCardPosition = () => {
    const deltaX = currentPos.current.x;
    const rotate = (deltaX / (window.innerWidth / 2)) * MAX_ROTATION;
    const opacity = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);
    
    setStyle({
      transform: `translateX(${deltaX}px) rotate(${rotate}deg)`,
    });

    if (deltaX !== 0) {
      const direction = deltaX > 0 ? 'right' : 'left';
      setFeedback({
        opacity: opacity,
        direction: direction,
        text: direction === 'right' ? 'ДА' : 'НЕТ'
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCurrent || isDragging.current || swipedDirection) return;
    // Prevent dragging when clicking on the expandable area's title
    if ((e.target as HTMLElement).closest('[data-expander]')) {
        return;
    }
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    cardContentRef.current?.style.setProperty('transition', 'none'); // Disable transition while dragging
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !isCurrent) return;
    currentPos.current = { x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y };
    updateCardPosition();
  };

  const resetPosition = () => {
     setStyle({
      transform: 'translateX(0px) rotate(0deg) scale(1)',
      transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    setFeedback({ opacity: 0, direction: null, text: '' });
  };

  const flyOut = (direction: 'left' | 'right') => {
    setIsExpanded(false); // Collapse card before flying out
    const flyOutX = (direction === 'right' ? 1 : -1) * (window.innerWidth + 200);
    const rotate = (direction === 'right' ? 1 : -1) * MAX_ROTATION * 1.5;
    setStyle({
      transform: `translateX(${flyOutX}px) rotate(${rotate}deg)`,
      transition: 'transform 0.3s ease-out'
    });
    onSwipe(direction);
  };
  
  const handlePointerUp = () => {
    if (!isDragging.current || !isCurrent) return;
    isDragging.current = false;
    cardContentRef.current?.style.removeProperty('transition');

    if (Math.abs(currentPos.current.x) > SWIPE_THRESHOLD) {
      flyOut(currentPos.current.x > 0 ? 'right' : 'left');
    } else {
      resetPosition();
    }
    currentPos.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    if (swipedDirection && isCurrent) {
      flyOut(swipedDirection);
    }
  }, [swipedDirection, isCurrent]);

  useEffect(() => {
    const pointerUpHandler = () => {
        if(isDragging.current) {
            handlePointerUp();
        }
    };
    document.addEventListener('pointerup', pointerUpHandler);
    return () => {
      document.removeEventListener('pointerup', pointerUpHandler);
    };
  }, []);

  const feedbackBorderStyle =
    feedback.direction === 'right' ? 'border-green-400' :
    feedback.direction === 'left' ? 'border-red-400' : 'border-transparent';
  
  const feedbackTextColor =
    feedback.direction === 'right' ? 'text-green-400' : 'text-red-400';

  return (
    <div
      ref={wrapperRef}
      className={`absolute w-full h-full p-1 touch-none select-none ${isCurrent ? 'cursor-grab' : ''}`}
      style={{ ...getStackStyle(), zIndex: 100 - stackIndex }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
          ref={cardContentRef}
          className={`relative w-full h-full bg-white rounded-2xl shadow-lg transition-all duration-300 ${isCurrent ? 'shadow-2xl' : 'shadow-md'}`}
          style={style}
      >
        <div className="flex flex-col justify-between h-full p-5 md:p-6 overflow-hidden">
          <div className="flex-grow min-h-0">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{service.section}</p>
            <p
              data-expander="true"
              className="mt-4 text-xl md:text-2xl font-bold text-slate-800 leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {service.name}
            </p>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] mt-3' : 'max-h-0'}`}
            >
              <div className="text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-200/80 pt-3 max-h-52 md:max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                <h3 className="font-semibold text-slate-700 mb-2">Что входит в услугу:</h3>
                <p>{service.description}</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 pt-2">
            <p className="text-sm font-medium text-slate-400 text-right">{service.code}</p>
          </div>
        </div>

        {/* Swipe Feedback Stamp */}
        <div
            className={`absolute top-10 ${feedback.direction === 'left' ? 'right-10' : 'left-10'} border-4 ${feedbackBorderStyle} rounded-lg p-2 transform ${feedback.direction === 'left' ? 'rotate-12' : '-rotate-12'}`}
            style={{ opacity: feedback.opacity, transition: 'opacity 100ms ease-in-out' }}
        >
            <span className={`text-3xl font-extrabold ${feedbackTextColor} tracking-wider`}>{feedback.text}</span>
        </div>
      </div>
    </div>
  );
};
