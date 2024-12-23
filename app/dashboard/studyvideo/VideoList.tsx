'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import ConfirmPopup from '@/ui/component/ConfirmPopup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import VideoItem from './VideoItem';

interface Video { id: string; title: string; author: string; email: string; views: number; videoUrl: string; createdAt?: string; user?: {
  profileImageUrl: string | null;
}; }

interface VideoListProps {
  userRole: string | undefined;
  email: string | undefined;
}

const getTimeAgo = (createdAt: string) => {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diff = now - created;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months}개월 전`;
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else {
    return '방금 전';
  }
};

const VideoList: React.FC<VideoListProps> = ({ userRole, email }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/studyreclist?t=${new Date().getTime()}`);
        if (!response.ok) {
          throw new Error('데이터를 가져오는데 실패했습니다');
        }
        const data = await response.json();

        const modifiedData = (Array.isArray(data) ? data : data.rows || []).map((video: any) => ({  
          id: video.id || video.row,
          title: video.title || '제목 없음',
          author: video.author || '저자 없음',
          email: video.email || '이메일 없음',
          path: video.path || '#',
          views: video.views || 0,
          videoUrl: video.website_url || video.path || '#',
          createdAt: video.createdAt || null,
          user: {
            profileImageUrl: video.user?.profileImageUrl || null
          }
        }));

        setVideos(modifiedData);
      } catch (error) {
        console.error('동영상 목록을 가져오는 중 오류 발생:', error);
        setError('동영상 목록을 불러오는데 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    const filtered = videos.filter(video =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVideos(filtered);
  }, [videos, searchTerm]);

  const openVideo = async (video: Video) => {
    setSelectedVideo(video);
    try {
      const response = await fetch(`/api/incrementViews?id=${video.id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('조회수 업데이트에 실패했습니다');
      }
      // 로컬 상태 업데이트
      setVideos(prevVideos =>
        prevVideos.map(v =>
          v.id === video.id ? { ...v, views: v.views + 1 } : v
        )
      );
    } catch (error) {
      console.error('조회수 업데이트 중 오류 발생:', error);
    }
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    toast[type](message, {
      position: "bottom-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const showConfirm = (message: string, callback: () => void) => {
    setConfirmMessage(message);
    setConfirmCallback(() => callback);
  };

  const handleConfirm = () => {
    if (confirmCallback) {
      confirmCallback();
    }
    setConfirmMessage(null);
    setConfirmCallback(null);
  };

  const handleCancel = () => {
    setConfirmMessage(null);
    setConfirmCallback(null);
  };

  const handleDelete = async (id: string) => {
    showConfirm('이 비디오를 삭제하시겠습니까?', async () => {
      try {
        // 삭제할 비디오의 정보 찾기
        const videoToDelete = videos.find(v => v.id === id);
        if (!videoToDelete) {
          throw new Error('비디오를 찾을 수 없습니다.');
        }

        // videoUrl에서 S3 키 추출 (앞의 '/' 제거)
        const s3Key = videoToDelete.videoUrl.startsWith('/') 
          ? videoToDelete.videoUrl.slice(1) 
          : videoToDelete.videoUrl;

        const response = await fetch(
          `/api/deleteStudyRec?id=${id}&videoUrl=${encodeURIComponent(s3Key)}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '삭제 요청이 실패했습니다.');
        }

        // UI 업데이트
        setVideos(prev => prev.filter(v => v.id !== id));
        setFilteredVideos(prev => prev.filter(v => v.id !== id));
        
        showToast('비디오가 성공적으로 삭제되었습니다.', 'success');
      } catch (error) {
        console.error('삭제 중 오류 발생:', error);
        showToast(
          error instanceof Error ? error.message : '비디오 삭제 중 오류가 발생했습니다.', 
          'error'
        );
      }
    });
  };

  if (error) {
    return <div>에러: {error}</div>;
  }

  return (
    <div className="mx-auto p-5">
      <div className="mb-5">
        <input
          type="text"
          placeholder="제목으로 검색"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2.5 text-base border border-gray-300 rounded font-sans"
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
        {filteredVideos.map((video) => (
          <VideoItem 
            key={video.id} 
            video={video} 
            openVideo={openVideo} 
            onDelete={handleDelete}
            userRole={userRole}
            userEmail={email}
          />
        ))}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 w-full h-full bg-slate-100 flex flex-col z-[1000]">
          <div className="flex justify-between items-center p-4 text-gray-800">
            <h2 className="text-xl font-medium">{selectedVideo.title}</h2>
            <button 
              onClick={closeVideo}
              className="hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 max-h-[calc(100vh-80px)]">
            <div className="flex-1 flex flex-col">
              <div className="relative flex-1 p-4">
                <CustomVideoPlayer video={selectedVideo} />
              </div>

              <div className="lg:hidden bg-white p-4">
                <div className="text-gray-800">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image 
                        src={selectedVideo.user?.profileImageUrl || '/default-profile.svg'} 
                        alt={selectedVideo.author}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{selectedVideo.author}</h3>
                      <div className="text-sm text-gray-400">
                        조회수 {selectedVideo.views.toLocaleString()}회 • 
                        {selectedVideo.createdAt && getTimeAgo(selectedVideo.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-medium mb-2">동영상 정보</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedVideo.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-[400px] bg-white p-4 overflow-y-auto">
              <div className="text-gray-800">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image 
                      src={selectedVideo.user?.profileImageUrl || '/default-profile.svg'} 
                      alt={selectedVideo.author}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{selectedVideo.author}</h3>
                    <div className="text-sm text-gray-400">
                      조회수 {selectedVideo.views.toLocaleString()}회 • 
                      {selectedVideo.createdAt && getTimeAgo(selectedVideo.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-medium mb-2">동영상 정보</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedVideo.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {confirmMessage && (
        <ConfirmPopup 
          message={confirmMessage} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel} 
        />
      )}
    </div>
  );
};

const CustomVideoPlayer: React.FC<{ video: Video }> = ({ video }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularProgress />
        </div>
      )}
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          className="w-auto h-auto max-w-full max-h-full object-contain"
          src={`https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com${video.videoUrl}`}
          controls
          autoPlay
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default VideoList;
