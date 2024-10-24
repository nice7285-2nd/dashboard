import React from 'react';

interface ColorOption {
  value: string;
  label: string;
}

interface NodeSelectorProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const NodeSelector: React.FC<NodeSelectorProps> = ({ title, value, onChange, options }) => {
  return (
    <div className="ml-5 flex items-center">
      <label className='text-xs mr-1'>{title}</label>
      <select 
        className='p-[5px] rounded-md border border-gray-300 bg-white text-xs'
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default NodeSelector;
