
import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  colorClass: string;
  trend?: 'up' | 'down' | 'neutral';
  children?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, value, unit, icon, colorClass, trend, children 
}) => {
  return (
    <div className={`glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all hover:scale-[1.02] border-l-4 ${colorClass}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</span>
        <i className={`fa-solid ${icon} text-xl opacity-80`}></i>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        <span className="text-gray-500 text-sm font-medium">{unit}</span>
      </div>
      {trend && !children && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {trend === 'up' && <span className="text-green-500"><i className="fa-solid fa-arrow-up"></i> +2%</span>}
          {trend === 'down' && <span className="text-red-500"><i className="fa-solid fa-arrow-down"></i> -1%</span>}
          <span className="text-gray-600 ml-1">vs last hr</span>
        </div>
      )}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};
