import React, { useState } from 'react';

interface SaveRecordingPopupProps {
  onSave: (title: string) => void;
  onCancel: () => void;
}

const SaveRecordingPopup: React.FC<SaveRecordingPopupProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">녹화 파일 저장</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="녹화 파일 제목을 입력하세요"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <div className="flex justify-end">
          <button
            onClick={() => onSave(title)}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            저장
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-black px-4 py-2 rounded"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveRecordingPopup;