'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';

interface ProfileImageUploaderProps {
  currentImageUrl?: string;
  email: string;
}

export default function ProfileImageUploader({ currentImageUrl, email }: ProfileImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('email', email);

      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
        headers: {
          'next-action': '1',
        }
      });

      if (!response.ok) {
        throw new Error('업로드 실패');
      }

      const data = await response.json();
      setPreview(data.url);
      toast.success('이미지가 성공적으로 업로드되었습니다.');
    } catch (error) {
      console.error('업로드 에러:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32">
        <div className="w-full h-full rounded overflow-hidden flex items-center justify-center">
          {preview ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={preview}
                alt="Profile"
                width={128}
                height={128}
                className="rounded"
                priority
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 border border-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
      {isUploading && (
        <p className="text-sm text-blue-500">업로드 중...</p>
      )}
    </div>
  );
} 