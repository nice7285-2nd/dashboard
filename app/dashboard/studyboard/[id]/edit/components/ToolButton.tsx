import React from 'react';
import Image from 'next/image';

interface ToolButtonProps {
  tool: string;
  icon: string;
  onClick: () => void;
  currentTool: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  icon,
  onClick,
  currentTool,
}) => (
  <button
    onClick={onClick}
    style={{
      marginBottom: '0px',
      width: '50px',
      height: '50px',
      backgroundColor: currentTool === tool ? '#e0e0e0' : 'white',
      border: '1px solid #ccc',
      borderRadius: '5px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
    }}
    onMouseDown={(e) =>
      (e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)')
    }
    onMouseUp={(e) =>
      (e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)')
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)')
    }
  >
    <Image src={icon} alt={tool} width={24} height={24} />
  </button>
);

export default ToolButton;
