import React from 'react';

interface ConfirmPopupProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="relative w-full max-w-sm mx-auto">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-3">확인</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {message}
            </p>
          </div>
          <div className="flex items-center justify-end p-4">
            <button
              className="text-slate-500 background-transparent font-bold uppercase px-4 py-2 text-xs outline-none focus:outline-none mr-2"
              type="button"
              onClick={onCancel}
            >
              취소
            </button>
            <button
              className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none"
              type="button"
              onClick={onConfirm}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
