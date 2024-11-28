'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import ConfirmPopup from '@/ui/component/ConfirmPopup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

interface Video { id: string; title: string; author: string; email: string; views: number; videoUrl: string; createdAt?: string; profileImageUrl?: string; }

interface VideoListProps {
  userRole: string | undefined;
  email: string | undefined;
}

const VideoItem = ({ video, openVideo, onDelete, userRole, userEmail }: { video: Video & { createdAt?: string }; openVideo: (video: Video) => void; onDelete: (id: string) => void; userRole: string | undefined; userEmail: string | undefined }) => {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isManager = userRole === 'admin';
  const isOwner = userEmail === video.email;
  const isNew = video.createdAt && (
    new Date().getTime() - new Date(video.createdAt).getTime() < 24 * 60 * 60 * 1000
  );
  const [duration, setDuration] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('0:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    videoRef.current?.pause();
  };

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

  useEffect(() => {
    const videoElement = document.createElement('video');
    
    const handleCanPlay = () => {
      videoElement.currentTime = Number.MAX_SAFE_INTEGER;
      
      setTimeout(() => {
        const realDuration = videoElement.currentTime;
        if (realDuration && !isNaN(realDuration)) {
          const minutes = Math.floor(realDuration / 60);
          const seconds = Math.floor(realDuration % 60);
          setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          setIsLoading(false);
        }
      }, 100);
    };

    videoElement.addEventListener('canplay', handleCanPlay);

    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com${video.videoUrl}`;

    const absoluteUrl = video.videoUrl.startsWith('/')
      ? `${window.location.origin}${video.videoUrl}`
      : video.videoUrl;

    // videoElement.src = absoluteUrl;
    videoElement.src = s3Url;
    videoElement.load();

    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.remove();
    };
  }, [video.videoUrl]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && isHovering) {
      setCurrentTime(formatTime(videoRef.current.currentTime));
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="200px" bgcolor="#f5f5f5">
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  return (
    <div 
      onClick={() => openVideo(video)} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      <div className="flex-1">
        <div style={{ position: 'relative' }}>
          <video 
            ref={videoRef} 
            src={`https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com${video.videoUrl}`}
            preload="metadata"
            style={{ 
              width: '100%', 
              aspectRatio: '16 / 9', 
              objectFit: 'cover', 
              marginBottom: '10px', 
              transition: 'transform 0.3s ease', 
              // transform: isHovering ? 'scale(1.05)' : 'scale(1)', 
              // boxShadow: isHovering ? '0 4px 8px rgba(0,0,0,0.1)' : 'none', 
              borderRadius: '10px' 
            }} 
            muted 
            loop 
            playsInline 
            onTimeUpdate={handleTimeUpdate}
          />
          {isNew && (
            <span className="absolute top-3 left-3 bg-emerald-500 bg-opacity-90 text-white text-[10px] px-2 py-1 rounded">
              NEW
            </span>
          )}
          <span className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
            {isHovering ? currentTime : duration}
          </span>
        </div>
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image 
                src={video.profileImageUrl || '/default-profile.svg'} 
                alt={video.author}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-normal mb-1">
                {video.title}
              </h3>
              <div className="text-sm text-gray-600">
                <div>{video.author}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span>조회수 {video.views.toLocaleString()}회</span>
                  <span>•</span>
                  <span>{video.createdAt && getTimeAgo(video.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          {(isOwner) && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(video.id);
              }}
              disabled={isDeleting}
              className="bg-rose-600 bg-opacity-90 text-white border-none px-2 py-1 rounded cursor-pointer text-xs hover:bg-rose-700 disabled:opacity-50"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
          profileImageUrl: video.profileImageUrl || null,
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
    <div style={{ margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="제목으로 검��"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'Noto Sans KR, sans-serif'
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ position: 'relative', width: '80%', maxWidth: '1600px', aspectRatio: '16 / 9', backgroundColor: 'black' }}>
            {isLoading && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <CircularProgress />
              </div>
            )}
            <video
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              width="100%"
              height="100%"
              src={`https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com${selectedVideo.videoUrl}`}
              controls
              autoPlay
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            <button onClick={closeVideo} style={{ position: 'absolute', top: '-40px', right: '0', background: 'transparent', border: 'none', padding: '10px', cursor: 'pointer', fontSize: '24px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '40px', height: '40px', borderRadius: '50%' }}>
              &#10005;
            </button>
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

export default VideoList;
