'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import ConfirmPopup from '@/ui/component/ConfirmPopup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import ReactPlayer from 'react-player';

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

    const s3Url = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com${video.videoUrl}`;

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image 
                src={video.user?.profileImageUrl || '/default-profile.svg'} 
                alt={video.author}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-normal mb-1 break-words pr-2">
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
            <div className="flex-shrink-0 ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(video.id);
                }}
                disabled={isDeleting}
                className="bg-rose-600 bg-opacity-90 text-white border-none px-2 py-1 rounded cursor-pointer text-xs hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
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
    <div style={{ margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="제목으로 검색"
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
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(0, 0, 0, 0.95)', 
          display: 'flex', 
          flexDirection: 'column', 
          zIndex: 1000 
        }}>
          <div className="flex justify-between items-center p-4 text-white">
            <h2 className="text-xl font-medium">{selectedVideo.title}</h2>
            <button 
              onClick={closeVideo}
              className="hover:bg-gray-700 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 max-h-[calc(100vh-80px)]">
            <div className="flex-1 flex flex-col">
              <div className="relative flex-1">
                <CustomVideoPlayer video={selectedVideo} />
              </div>

              <div className="lg:hidden bg-black p-4">
                <div className="text-white">
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

                  <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                    <h4 className="font-medium mb-2">동영상 정보</h4>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap">
                      {selectedVideo.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-[400px] bg-black p-4 overflow-y-auto">
              <div className="text-white">
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

                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-medium mb-2">동영상 정보1</h4>
                  <p className="text-sm text-gray-400 whitespace-pre-wrap">
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
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pip, setPip] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [loop, setLoop] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const playerRef = useRef<ReactPlayer>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // 키보드 단축키 설정
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          setPlaying(prev => !prev);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
          e.preventDefault();
          handleRewind();
          break;
        case 'l':
          e.preventDefault();
          handleFastForward();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSmallRewind();
          break;
        case 'arrowright':
          e.preventDefault();
          handleSmallForward();
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [volume, playing]);

  // 컨트롤 자동 숨김
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      setLastActivity(Date.now());
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (playing && Date.now() - lastActivity > 3000) {
          setShowControls(false);
        }
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [playing, lastActivity]);

  // 북마크 관리
  const addBookmark = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    setBookmarks(prev => [...prev, currentTime].sort((a, b) => a - b));
  };

  const removeBookmark = (time: number) => {
    setBookmarks(prev => prev.filter(t => t !== time));
  };

  const jumpToBookmark = (time: number) => {
    playerRef.current?.seekTo(time);
  };

  // 화질 설정
  const qualities = ['auto', '1080p', '720p', '480p', '360p'];

  // 자막 설정
  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSubtitle(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const toggleMute = () => setMuted(prev => !prev);
  const toggleFullscreen = () => setFullscreen(prev => !prev);
  const handleRewind = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10);
  const handleFastForward = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10);
  const handleSmallRewind = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 5);
  const handleSmallForward = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 5);
  const handleVolumeChange = (value: number) => setVolume(value);
  const handleProgress = (state: { played: number; loaded: number }) => {
    setPlayed(state.played);
    setLoaded(state.loaded);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={playerContainerRef} 
      className="relative group"
      style={{
        filter: `brightness(${brightness}%) contrast(${contrast}%)`
      }}
    >
      <ReactPlayer
        ref={playerRef}
        url={`https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com${video.videoUrl}`}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        pip={pip}
        loop={loop}
        onProgress={handleProgress}
        onDuration={setDuration}
        onBuffer={() => setBuffering(true)}
        onBufferEnd={() => setBuffering(false)}
        onError={(e) => console.error('비디오 재생 오류:', e)}
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous",
            },
            tracks: subtitle ? [
              {
                kind: 'subtitles',
                src: URL.createObjectURL(new Blob([subtitle], { type: 'text/vtt' })),
                srcLang: 'ko',
                default: true,
                label: '한국어',
              }
            ] : undefined,
          }
        }}
      />

      {/* 컨트롤 오버레이 */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* 상단 컨트롤 바 */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex justify-between items-center">
            <div className="text-white text-lg font-medium">{video.title}</div>
            <div className="flex items-center space-x-4">
              {/* 설정 버튼 */}
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className="text-white hover:text-red-500"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 설정 메뉴 */}
        {showSettings && (
          <div className="absolute top-16 right-4 bg-black/90 rounded-lg p-4 text-white">
            <div className="space-y-4">
              {/* 화질 설정 */}
              <div>
                <label className="block mb-2">화질</label>
                <select 
                  value={quality} 
                  onChange={(e) => setQuality(e.target.value)}
                  className="bg-gray-800 rounded p-1"
                >
                  {qualities.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              {/* 밝기 조절 */}
              <div>
                <label className="block mb-2">밝기</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 대비 조절 */}
              <div>
                <label className="block mb-2">대비</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 자막 업로드 */}
              <div>
                <label className="block mb-2">자막 업로드</label>
                <input
                  type="file"
                  accept=".vtt,.srt"
                  onChange={handleSubtitleUpload}
                  className="text-sm"
                />
              </div>

              {/* 반복 재생 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                  className="mr-2"
                />
                <label>반복 재생</label>
              </div>
            </div>
          </div>
        )}

        {/* 북마크 목록 */}
        {showBookmarks && (
          <div className="absolute top-16 left-4 bg-black/90 rounded-lg p-4 text-white">
            <h3 className="mb-2">북마크</h3>
            <div className="space-y-2">
              {bookmarks.map((time) => (
                <div key={time} className="flex items-center justify-between">
                  <button
                    onClick={() => jumpToBookmark(time)}
                    className="text-white hover:text-red-500"
                  >
                    {formatTime(time)}
                  </button>
                  <button
                    onClick={() => removeBookmark(time)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 컨트롤 바 */}
        {/* ... 기존 컨트롤 바 코드 ... */}
        
        {/* 추가 컨트롤 버튼들 */}
        <div className="absolute bottom-20 right-4 flex flex-col space-y-2">
          <button
            onClick={addBookmark}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full"
            title="북마크 추가"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
          
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-full"
            title="북마크 목록"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 버퍼링 인디케이터 */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"/>
        </div>
      )}
    </div>
  );
};

export default VideoList;
