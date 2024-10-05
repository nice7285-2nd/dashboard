'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface Video { id: string; title: string; channelName: string; views: number; videoUrl: string; }

const VideoItem = ({ video, openVideo }: { video: Video; openVideo: (video: Video) => void }) => {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div onClick={() => openVideo(video)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <video ref={videoRef} src={video.videoUrl} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', marginBottom: '10px', transition: 'transform 0.3s ease', transform: isHovering ? 'scale(1.05)' : 'scale(1)', boxShadow: isHovering ? '0 4px 8px rgba(0,0,0,0.1)' : 'none' }} muted loop playsInline />
      <h3 style={{ fontSize: '16px', marginBottom: '5px', fontFamily: 'Noto Sans KR, sans-serif', fontWeight: 600 }}>{video.title}</h3>
      <p style={{ fontSize: '14px', color: '#606060', marginBottom: '3px' }}>{video.channelName}</p>
      <p style={{ fontSize: '14px', color: '#606060' }}>조회수 {video.views.toLocaleString()}회</p>
    </div>
  );
};

const VideoList = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        console.log('서버에서 받은 데이터:', data);

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

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
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
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>학습 동영상</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {videos.map((video) => (
          <VideoItem key={video.id} video={video} openVideo={openVideo} />
        ))}
      </div>

      {selectedVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ position: 'relative', width: '80%', maxWidth: '800px', aspectRatio: '16 / 9', backgroundColor: 'black' }}>
            <iframe width="100%" height="100%" src={`${selectedVideo.videoUrl}?autoplay=1`} title={selectedVideo.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0 }}></iframe>
            <button onClick={closeVideo} style={{ position: 'absolute', top: '-40px', right: '0', background: 'transparent', border: 'none', padding: '10px', cursor: 'pointer', fontSize: '24px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '40px', height: '40px', borderRadius: '50%' }}>
              &#10005;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;