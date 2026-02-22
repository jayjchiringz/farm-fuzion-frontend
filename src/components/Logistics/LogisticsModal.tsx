// farm-fuzion-frontend/src/components/Logistics/LogisticsModal.tsx
import React from "react";
import { X, Truck, Construction, HardHat, Clock, MapPin, Package, Wrench } from "lucide-react";

interface LogisticsModalProps {
  onClose: () => void;
}

export default function LogisticsModal({ onClose }: LogisticsModalProps) {
  // Fun "under construction" messages
  const messages = [
    "Building smarter farm logistics...",
    "Paving the way to better deliveries...",
    "Loading your logistics hub...",
    "Routing your farm products...",
    "Mapping the fastest farm routes...",
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick} // Add backdrop click handler
    >
      <div 
        className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all animate-slide-up"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        
        {/* Header with construction theme */}
        <div className="p-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Truck size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Farm Logistics
                  <span className="text-sm bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                    Coming Soon
                  </span>
                </h2>
                <p className="text-white/80 text-sm">Your farm delivery hub is under construction</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body - Fun construction theme */}
        <div className="p-8 text-center">
          {/* Animated construction icons */}
          <div className="relative h-32 mb-6">
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <div className="animate-bounce" style={{ animationDelay: '0.1s' }}>
                <Construction size={48} className="text-yellow-500" />
              </div>
              <div className="animate-bounce" style={{ animationDelay: '0.3s' }}>
                <HardHat size={48} className="text-orange-500" />
              </div>
              <div className="animate-bounce" style={{ animationDelay: '0.5s' }}>
                <Wrench size={48} className="text-blue-500" />
              </div>
            </div>
          </div>

          {/* Main message */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            🚚 We're Building Something Great!
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our logistics team is working hard to bring you a comprehensive farm delivery system. 
            Soon you'll be able to:
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <Package size={24} className="mx-auto text-brand-green mb-2" />
              <p className="text-xs font-medium">Track Deliveries</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <MapPin size={24} className="mx-auto text-brand-green mb-2" />
              <p className="text-xs font-medium">Route Planning</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <Clock size={24} className="mx-auto text-brand-green mb-2" />
              <p className="text-xs font-medium">Schedule Pickups</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <Truck size={24} className="mx-auto text-brand-green mb-2" />
              <p className="text-xs font-medium">Fleet Management</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>75%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full animate-pulse" 
                   style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Random message */}
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            "{randomMessage}"
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <span>Got it!</span>
            <span>👷‍♂️</span>
          </button>
          <p className="text-xs text-center text-gray-500 mt-3">
            We'll notify you when logistics is ready!
          </p>
        </div>
      </div>
    </div>
  );
}
