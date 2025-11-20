import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  title,
  subtitle,
  action,
  padding = true,
  ...props 
}) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || action) && (
        <div className={`flex items-center justify-between ${padding ? 'p-6 pb-4' : 'p-6'}`}>
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  );
};

export default Card;
