import React from 'react';
import Image from 'next/image';

interface ToolButtonProps {
  tool: string;
  icon: string | React.ReactElement;
  onClick: () => void;
  currTool: string;
  label?: string;
  disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  icon,
  onClick,
  currTool,
  label,
  disabled
}) => (
  <button
    onClick={onClick}
    style={{ 
      marginBottom: '0px', 
      width: '50px', 
      height: '50px', 
      backgroundColor: currTool === tool || disabled ? '#e0e0e0' : 'white', 
      border: '1px solid #ccc', 
      borderRadius: '5px', 
      cursor: 'pointer', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      boxShadow: currTool === tool ? 'none' : '0 2px 5px rgba(0,0,0,0.1)',
      // transition: 'all 0.3s ease' 
    }}
    onMouseDown={(e) =>(e.currentTarget.style.boxShadow = 'none')}
    onMouseUp={(e) =>(e.currentTarget.style.boxShadow = currTool === tool || disabled ? 'none' : '0 2px 5px rgba(0,0,0,0.1)')}
    // onMouseLeave={(e) =>(e.currentTarget.style.boxShadow = currTool === tool ? 'none' : '0 2px 5px rgba(0,0,0,0.1)')}
  >
    {typeof icon === 'string' ? (
      <Image src={icon} alt={tool} width={24} height={24} />
    ) : (
      React.cloneElement(icon, { width: 24, height: 24 })
    )}
    {label !== undefined && <span className="label text-xs">{label}</span>}    
  </button>
);

export default ToolButton;
