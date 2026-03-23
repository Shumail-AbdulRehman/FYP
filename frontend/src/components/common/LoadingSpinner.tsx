import React from 'react';

type SpinnerSize = 'small' | 'default' | 'large';

interface LoadingSpinnerProps {
  className?: string;
  size?: SpinnerSize;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = '',
  size = 'default',
  fullScreen = true,
}) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    small: 'w-5 h-5',
    default: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.default;

  const Spinner = () => (
    <div className={`relative ${spinnerSize} ${className}`}>
     
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          background:
            'conic-gradient(from 0deg, transparent, oklch(0.65 0.25 285), transparent)',
        }}
      />

    
      <div className="absolute inset-[3px] rounded-full bg-[#0a0a0f]" />

     
      <div
        className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-violet-500 animate-pulse-dot"
        style={{
          boxShadow: '0 0 20px oklch(0.65 0.25 285 / 0.6)',
        }}
      />
    </div>
  );

  if (!fullScreen) {
    return <Spinner />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        <Spinner />

        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-zinc-400">
            Loading
          </span>
          <span className="text-violet-400 animate-pulse">...</span>
        </div>

        <div
          className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
          style={{
            background:
              'radial-gradient(circle, oklch(0.65 0.25 285) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;