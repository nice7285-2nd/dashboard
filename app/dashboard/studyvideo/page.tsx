'use client';

import { useState } from 'react';
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
  const [videos, setVideos] = useState<Video[]>([
    {
      id: '1',
      title: '리액트 기초 강좌',
      thumbnail: '/teacher.png',
      channelName: '코딩 채널',
      views: 10000,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // youtube-nocookie.com 사용
    },
    {
      id: '2',
      title: 'Next.js 튜토리얼',
      thumbnail: '/teacher.png',
      channelName: '웹 개발 마스터',
      views: 5000,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // 예시 URL
    },
    {
      id: '3',
      title: 'TypeScript 완전 정복',
      thumbnail: '/teacher.png',
      channelName: 'TS 러버',
      views: 7500,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // 예시 URL
    },
    {
      id: '4',
      title: 'CSS 트릭스 모음',
      thumbnail: '/teacher.png',
      channelName: '디자인 고수',
      views: 3000,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // 예시 URL
    },
    {
      id: '5',
      title: 'CSS 트릭스 모음',
      thumbnail: '/teacher.png',
      channelName: '디자인 고수',
      views: 3000,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // 예시 URL
    },
    {
      id: '6',
      title: 'CSS 트릭스 모음',
      thumbnail: '/teacher.png',
      channelName: '디자인 고수',
      views: 3000,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // 예시 URL
    },
    {
      id: '7',
      title: 'CSS 트릭스 모음',
      thumbnail: '/teacher.png',
      channelName: '디자인 고수',
      views: 3000,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // 예시 URL
    },
    {
      id: '8',
      title: 'CSS 트릭스 모음',
      thumbnail: '/teacher.png',
      channelName: '디자인 고수',
      views: 3000,
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', // 예시 URL
    },
  ]);

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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
            key={video.id}
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
            }}
          >
            <iframe
              width="100%"
              height="100%"
              src={`${selectedVideo.videoUrl}?autoplay=1`} // autoplay와 mute 파라미터 추가
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
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
