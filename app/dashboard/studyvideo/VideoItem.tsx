import { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Image from 'next/image';

interface Video {
  id: string;
  title: string;
  author: string;
  email: string;
  views: number;
  videoUrl: string;
  createdAt?: string;
  user?: {
    profileImageUrl: string | null;
  };
}

interface VideoItemProps {
  video: Video;
  openVideo: (video: Video) => void;
  onDelete: (id: string) => void;
  userRole: string | undefined;
  userEmail: string | undefined;
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

const VideoItem: React.FC<VideoItemProps> = ({ video, openVideo, onDelete, userRole, userEmail }) => {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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
              height: '100%',
              aspectRatio: '16 / 9',
              objectFit: 'contain',
              marginBottom: '10px', 
              transition: 'transform 0.3s ease',
              borderRadius: '10px',
              backgroundColor: 'black'
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

export default VideoItem; 