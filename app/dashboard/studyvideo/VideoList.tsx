'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef<ReactPlayer>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => setPlaying(prev => !prev);
  const handleVolumeChange = (newValue: number) => setVolume(newValue);
  const handleToggleMute = () => setMuted(prev => !prev);
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };
  const handleSeekMouseDown = () => setSeeking(true);
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value));
    }
  };

  const handleProgress = (state: { played: number; loaded: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch(e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
        e.preventDefault();
        handleToggleMute();
        break;
      case 'arrowleft':
        e.preventDefault();
        if (playerRef.current) {
          playerRef.current.seekTo(playerRef.current.getCurrentTime() - 5);
        }
        break;
      case 'arrowright':
        e.preventDefault();
        if (playerRef.current) {
          playerRef.current.seekTo(playerRef.current.getCurrentTime() + 5);
        }
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault();
        if (playerRef.current) {
          playerRef.current.seekTo((parseInt(e.key) * duration) / 10);
        }
        break;
    }
  }, [duration]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div 
      ref={playerContainerRef}
      className="relative w-full h-full"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularProgress />
        </div>
      )}
      <ReactPlayer
        ref={playerRef}
        url={`https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com${video.videoUrl}`}
        className="w-full h-full"
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        onReady={() => setIsLoading(false)}
        onStart={() => setIsLoading(false)}
        onBuffer={() => setIsLoading(true)}
        onBufferEnd={() => setIsLoading(false)}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
              onContextMenu: (e: React.MouseEvent) => e.preventDefault()
            }
          }
        }}
      />
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center gap-4 text-white">
            <button onClick={handlePlayPause}>
              {playing ? '⏸️' : '▶️'}
            </button>
            <button onClick={handleToggleMute}>
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24"
            />
            <span>{formatTime(duration * played)} / {formatTime(duration)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              value={played}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="flex-1"
            />
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-white"
            >
              {[0.5, 1, 1.5, 2].map(rate => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
            <button onClick={toggleFullscreen}>
              {fullscreen ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;
