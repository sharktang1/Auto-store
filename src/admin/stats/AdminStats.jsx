import React from 'react';
import { Loader2 } from 'lucide-react';

const ComingSoon = ({ title = "Coming Soon", description = "This feature is under development" }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border border-gray-200">
      <div className="text-center space-y-6 max-w-md">
        {/* Animated loading icon */}
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        </div>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900">
          {title}
        </h2>
        
        {/* Description */}
        <p className="text-gray-600">
          {description}
        </p>
        
        {/* Decorative element */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" />
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-100" />
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;