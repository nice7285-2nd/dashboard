import React from 'react';

interface ClearConfirmPopupProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ClearConfirmPopup: React.FC<ClearConfirmPopupProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <p className="mb-6">전체 지우기 하시겠습니까?</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearConfirmPopup;
