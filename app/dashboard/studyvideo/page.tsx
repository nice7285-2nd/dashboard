'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  views: number;
  videoUrl: string; // 비디오 URL 추가
}

const VideoList = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // URL에 타임스탬프를 추가하여 캐시를 방지합니다
        const response = await fetch(`/api/studyreclist?t=${new Date().getTime()}`);
        if (!response.ok) {
          throw new Error('데이터를 가져오는데 실패했습니다');
        }
        const data = await response.json();

        console.log('서버에서 받은 데이터:', data);

        const modifiedData = data.rows.map((video: any) => ({  
          id: video.id || video.row,
          title: video.name || '제목 없음',
          thumbnail: '/teacher.png',
          channelName: '영어 채널',
          views: 10000,
          videoUrl: video.website_url || video.path || '#',
        }));

        setVideos(modifiedData);
      } catch (error) {
        console.error('동영상 목록을 가져오는 중 오류 발생:', error);
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

  return (
    <div style={{ margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>추천 동영상</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px',
        }}
      >
        {videos.map((video) => (
          <div
            key={video.id} // 여기에 고유한 key를 추가합니다
            style={{ cursor: 'pointer' }}
            onClick={() => openVideo(video)}
          >
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={250}
              height={141}
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                objectFit: 'cover',
                marginBottom: '10px',
              }}
            />
            <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>
              {video.title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: '#606060',
                marginBottom: '3px',
              }}
            >
              {video.channelName}
            </p>
            <p style={{ fontSize: '14px', color: '#606060' }}>
              조회수 {video.views.toLocaleString()}회
            </p>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '80%',
              maxWidth: '800px',
              aspectRatio: '16 / 9',
              backgroundColor: 'black', // 배경색을 검정으로 설정
            }}
          >
            <iframe
              width="100%"
              height="100%"
              src={`${selectedVideo.videoUrl}?autoplay=1`}
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0 }} // iframe을 컨테이너에 맞춤
            ></iframe>
            <button
              onClick={closeVideo}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'transparent',
                border: 'none',
                padding: '10px',
                cursor: 'pointer',
                fontSize: '24px',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
              }}
            >
              &#10005;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;
