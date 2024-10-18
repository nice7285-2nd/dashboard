'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import ConfirmPopup from '@/ui/component/ConfirmPopup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Video { id: string; title: string; channelName: string; views: number; videoUrl: string; }

interface VideoListProps {
  userRole: string | undefined;
}

const VideoItem = ({ video, openVideo, onDelete, userRole }: { video: Video; openVideo: (video: Video) => void; onDelete: (id: string) => void; userRole: string | undefined }) => {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isManager = userRole === 'admin';

  const handleMouseEnter = () => {
    setIsHovering(true);
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    videoRef.current?.pause();
  };

  return (
    <div 
      onClick={() => openVideo(video)} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      <video 
        ref={videoRef} 
        src={video.videoUrl} 
        style={{ 
          width: '100%', 
          aspectRatio: '16 / 9', 
          objectFit: 'cover', 
          marginBottom: '10px', 
          transition: 'transform 0.3s ease', 
          transform: isHovering ? 'scale(1.05)' : 'scale(1)', 
          boxShadow: isHovering ? '0 4px 8px rgba(0,0,0,0.1)' : 'none', 
          borderRadius: '10px' 
        }} 
        muted 
        loop 
        playsInline 
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <h3 style={{ fontSize: '16px', fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 400, margin: 0, flex: 1 }}>{video.title}</h3>
        {isManager && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(video.id);
            }}
            style={{
              backgroundColor: 'rgba(255, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '10px'
            }}
          >
            삭제
          </button>
        )}
      </div>
      <p style={{ fontSize: '14px', color: '#606060', marginBottom: '3px' }}>{video.channelName}</p>
      <p style={{ fontSize: '14px', color: '#606060' }}>조회수 {video.views.toLocaleString()}회</p>
    </div>
  );
};

const VideoList: React.FC<VideoListProps> = ({ userRole }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);

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

        // console.log('서버에서 받은 데이터:', data);

        const modifiedData = data.rows.map((video: any) => ({  
          id: video.id || video.row,
          title: video.name || '제목 없음',
          channelName: video.channelName || '영어 채널',
          views: video.views || 10000,
          videoUrl: video.website_url || video.path || '#',
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

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
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
      autoClose: 3000,
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
        const response = await fetch(`/api/deleteStudyRec?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('삭제 요청이 실패했습니다.');
        }

        setVideos(prevVideos => prevVideos.filter(video => video.id !== id));
        showToast('비디오가 성공적으로 삭제되었습니다.', 'success');
        router.refresh();
      } catch (error) {
        console.error('삭제 중 오류 발생:', error);
        showToast('비디오 삭제 중 오류가 발생했습니다.', 'error');
      }
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#f5f5f5">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {filteredVideos.map((video) => (
          <VideoItem 
            key={video.id} 
            video={video} 
            openVideo={openVideo} 
            onDelete={handleDelete}
            userRole={userRole}
          />
        ))}
      </div>

      {selectedVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ position: 'relative', width: '80%', maxWidth: '1600px', aspectRatio: '16 / 9', backgroundColor: 'black' }}>
            <iframe width="100%" height="100%" src={`${selectedVideo.videoUrl}?autoplay=1`} title={selectedVideo.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0 }}></iframe>
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
