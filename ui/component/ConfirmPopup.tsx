import React from 'react';

interface ConfirmPopupProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="relative max-w-sm mx-auto min-w-[300px]">
        <div className="relative flex flex-col bg-white p-4 border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">확인</h3>
            <p className="leading-relaxed text-sm">
              {message}
            </p>
          </div>
          <div className="flex items-center justify-end">
            <button
              className="background-transparent uppercase px-4 py-2 outline-none focus:outline-none mr-2 text-sm"
              type="button"
              onClick={onCancel}
            >
              취소
            </button>
            <button
              className="bg-rose-600 bg-opacity-90 text-white uppercase px-4 py-2 rounded shadow hover:bg-rose-700 outline-none focus:outline-none text-sm"
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
