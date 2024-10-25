import { toast } from 'react-toastify';
import { createStudyRec } from '../actions';

export const startRec = async (
  setIsRec: (isRec: boolean) => void,
  setRecBlob: (blob: Blob | null) => void,
  setShowSaveRecPopup: (show: boolean) => void,
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>
) => {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
      video: { displaySurface: "browser" },
      audio: true 
    });

    const audioStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });

    const audioContext = new AudioContext();
    const systemSource = audioContext.createMediaStreamSource(displayStream);
    const micSource = audioContext.createMediaStreamSource(audioStream);
    const destination = audioContext.createMediaStreamDestination();

    const systemGain = audioContext.createGain();
    const micGain = audioContext.createGain();
    systemSource.connect(systemGain).connect(destination);
    micSource.connect(micGain).connect(destination);

    const combinedStream = new MediaStream([
      ...displayStream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ]);
    
    mediaRecorderRef.current = new MediaRecorder(combinedStream);

    const chunks: BlobPart[] = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      
      displayStream.getTracks().forEach(track => track.stop());
      audioStream.getTracks().forEach(track => track.stop());
      setIsRec(false);

      setRecBlob(blob);
      setShowSaveRecPopup(true);
    };

    mediaRecorderRef.current.start();
    setIsRec(true);
  } catch (error) {
    console.error('화면 및 오디오 녹화를 시작하는 데 실패했습니다:', error);
    toast.error('화면 및 오디오 녹화를 시작하는 데 실패했습니다. 다시 시도해 주세요.');
  }
};

export const stopRec = (mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>) => {
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();
  }
};

export const saveRec = async (
  author: string,
  email: string,
  title: string,
  RecBlob: Blob | null,
  setShowSaveRecPopup: (show: boolean) => void,
  setRecBlob: (blob: Blob | null) => void
) => {
  setShowSaveRecPopup(false);
  if (!RecBlob) {
    toast.error('저장할 녹화 파일이 없습니다.');
    return;
  }

  const filename = `${Date.now()}.webm`;
  const filePath = `/studyRec/${filename}`;

  try {
    const formData = new FormData();
    formData.append('file', RecBlob, filename);
    formData.append('path', filePath);

    const response = await fetch('/api/save-Rec', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const dbFormData = new FormData();
      dbFormData.append('author', author);
      dbFormData.append('email', email);
      dbFormData.append('title', title);
      dbFormData.append('path', filePath);
      const result = await createStudyRec(dbFormData);

      if (result.message === 'Created StudyRec.') {
        toast.success(`녹화 파일 "${title}"이(가) 성공적으로 저장되었습니다.`);
      } else {
        throw new Error(result.message);
      }
    } else {
      throw new Error('녹화 파일 저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('녹화 파일 저장 중 오류 발생:', error);
    toast.error('녹화 파일 저장에 실패했습니다. 다시 시도해 주세요.');
  }
  setRecBlob(null);
};
