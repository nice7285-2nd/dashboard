'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import YouTube from 'react-youtube';
import axios from 'axios';

const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoId, setVideoId] = useState('t2U0uP2hV4c'); // 기본 유튜브 비디오 ID (바비킴의 "고래의 꿈")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]); // 타입을 명시적으로 지정
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]); // 타입을 명시적으로 지정
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.start();
    } catch (error) {
      console.error('화면 녹화를 시작할 수 없습니다:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const uploadRecording = useCallback(async () => {
    if (recordedChunks.length === 0) {
      console.error('업로드할 녹화 파일이 없습니다.');
      return;
    }

    setIsUploading(true);

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('file', blob); // 'file'이라는 키로 파일을 추가해야 합니다.

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('업로드 실패');
      }

      const data = await response.json();
      console.log('업로드 성공:', data);
      setRecordedChunks([]); // 업로드 후 recordedChunks 초기화
    } catch (error) {
      console.error('업로드 실패:', error);
    } finally {
      setIsUploading(false);
    }
  }, [recordedChunks]);

  useEffect(() => {
    if (recordedChunks.length > 0) {
      // 자동 다운로드 대신 업로드 함수 호출
      uploadRecording();
    }
  }, [recordedChunks, uploadRecording]);

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoId(e.target.value);
  };

  return (
    <div>
      <div>
        <input
          type="text"
          value={videoId}
          onChange={handleVideoIdChange}
          placeholder="유튜브 비디오 ID 입력"
        />
      </div>
      <div
        style={{
          width: '50%', // 화면의 반 크기로 변경
          height: '0',
          paddingBottom: '28.125%', // 16:9 비율의 절반 (56.25% / 2)
          position: 'relative',
          margin: '20px auto', // 가운데 정렬을 위해 auto로 변경
          overflow: 'hidden',
        }}
      >
        <YouTube
          videoId={videoId}
          opts={{
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
            },
          }}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      {!isRecording ? (
        <button onClick={startRecording}>녹화 시작</button>
      ) : (
        <button onClick={stopRecording}>녹화 중지</button>
      )}
    </div>
  );
};

export default ScreenRecorder;
