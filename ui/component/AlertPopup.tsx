import React from 'react';

interface AlertPopupProps {
  message: string;
  onClose: () => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="relative w-full max-w-sm mx-auto">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-3">알림</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {message}
            </p>
          </div>
          <div className="flex items-center justify-end p-4">
            <button
              className="bg-emerald-500 text-white active:bg-emerald-600 uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none"
              type="button"
              onClick={onClose}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;
