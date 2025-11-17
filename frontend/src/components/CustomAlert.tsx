'use client';

import { useEffect } from 'react';

interface CustomAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export default function CustomAlert({ 
  isOpen, 
  title, 
  message, 
  type = 'info', 
  onClose 
}: CustomAlertProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when alert is open
      document.body.style.overflow = 'hidden';
      
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-green-500 via-emerald-500 to-teal-500',
          icon: (
            <svg className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          buttonGradient: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        };
      case 'error':
        return {
          gradient: 'from-red-500 via-pink-500 to-rose-500',
          icon: (
            <svg className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          buttonGradient: 'from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
        };
      case 'warning':
        return {
          gradient: 'from-yellow-500 via-orange-500 to-amber-500',
          icon: (
            <svg className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          buttonGradient: 'from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
        };
      default:
        return {
          gradient: 'from-blue-500 via-purple-500 to-pink-500',
          icon: (
            <svg className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          buttonGradient: 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"></div>
      
      {/* Alert Modal */}
      <div 
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-[90vw] sm:max-w-md w-full overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${styles.gradient} p-5 sm:p-6 md:p-8 text-center relative overflow-hidden`}>
          {/* Animated background circles */}
          <div className="absolute top-0 left-0 w-20 h-20 sm:w-28 md:w-32 sm:h-28 md:h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 md:w-40 sm:h-32 md:h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse delay-75"></div>
          
          {/* Icon */}
          <div className="relative flex justify-center mb-3 sm:mb-4 animate-bounceIn">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 sm:p-3.5 md:p-4">
              {styles.icon}
            </div>
          </div>
          
          {/* Title */}
          {title && (
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg relative">
              {title}
            </h3>
          )}
        </div>
        
        {/* Content */}
        <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed text-center whitespace-pre-line">
            {message}
          </p>
        </div>
        
        {/* Footer */}
        <div className="px-4 pb-5 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
          <button
            onClick={onClose}
            className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${styles.buttonGradient} text-white font-bold text-base sm:text-lg shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 touch-manipulation`}
          >
            <span>Đóng</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }
        
        .delay-75 {
          animation-delay: 75ms;
        }
      `}</style>
    </div>
  );
}

