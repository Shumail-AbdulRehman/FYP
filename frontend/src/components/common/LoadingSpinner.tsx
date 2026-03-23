import React from 'react';

type SpinnerSize = 'small' | 'default' | 'large';

/**
 * Three usage modes:
 *
 *  1. Inline  — default, renders just the spinner in flow.
 *               <LoadingSpinner size="small" color="#fff" />
 *
 *  2. fullScreen — fixed viewport overlay with blur backdrop.
 *               <LoadingSpinner fullScreen />
 *
 *  3. overlay — absolute overlay that fills the nearest `relative` parent.
 *               Wrap your component in `<div className="relative">` and mount:
 *               <LoadingSpinner overlay />
 */
interface LoadingSpinnerProps {
  size?: SpinnerSize;
  fullScreen?: boolean;
  overlay?: boolean;
  color?: string;
  thickness?: number;
}

const sizeMap: Record<SpinnerSize, string> = {
  small: 'w-5 h-5',
  default: 'w-10 h-10',
  large: 'w-16 h-16',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  fullScreen = false,
  overlay = false,
  color = '#7c3aed',
  thickness = 3,
}) => {
  const ring = `${color}33`; 

  const Spinner = () => (
    <div
      className={`rounded-full animate-spin shrink-0 ${sizeMap[size]}`}
      style={{
        borderWidth: thickness,
        borderStyle: 'solid',
        borderColor: ring,
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: color,
        borderLeftColor: ring,
      }}
    />
  );

  
  if (!fullScreen && !overlay) return <Spinner />;

  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Spinner />
      </div>
    );
  }

  
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-white/60 backdrop-blur-[2px]">
      <Spinner />
    </div>
  );
};

export default LoadingSpinner;