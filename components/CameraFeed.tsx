import React, { useEffect, useRef } from 'react';
import { PoseResults } from '../types';

interface CameraFeedProps {
  onPoseResults: (results: PoseResults) => void;
  onFrameCapture: (base64: string) => void;
  isActive: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onPoseResults, onFrameCapture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastCaptureTime = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const CAPTURE_INTERVAL = 1000;

  useEffect(() => {
    let pose: any = null;
    let stream: MediaStream | null = null;
    let isMounted = true;

    const setup = async () => {
      if (!videoRef.current) return;

      // Access globally loaded Pose class
      const Pose = (window as any).Pose;
      if (!Pose) {
        console.error("MediaPipe Pose not loaded");
        return;
      }

      pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1, // 0=Lite (Fastest), 1=Full (Balanced), 2=Heavy (Accurate)
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults((results: any) => {
        if (!isMounted) return;
        
        if (results.poseLandmarks) {
             onPoseResults(results as PoseResults);
        }

        const now = Date.now();
        if (isActive && now - lastCaptureTime.current > CAPTURE_INTERVAL && videoRef.current) {
            captureFrame(videoRef.current);
            lastCaptureTime.current = now;
        }
      });

      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                frameRate: { ideal: 30 }
            } 
        });
        
        if (videoRef.current && isMounted) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                if (isMounted) {
                    videoRef.current?.play();
                    requestFrame();
                }
            };
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    const requestFrame = () => {
        requestRef.current = requestAnimationFrame(processFrame);
    };

    const processFrame = async () => {
        if (!isMounted) return;
        
        if (videoRef.current && pose && videoRef.current.readyState >= 2) {
             await pose.send({ image: videoRef.current });
        }
        
        if (isMounted) {
            requestFrame();
        }
    };

    setup();

    return () => {
        isMounted = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (pose) pose.close();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isActive, onPoseResults]);

  const captureFrame = (video: HTMLVideoElement) => {
      if (!captureCanvasRef.current) {
          captureCanvasRef.current = document.createElement('canvas');
          captureCanvasRef.current.width = 320; // Lower res for AI is sufficient and faster
          captureCanvasRef.current.height = 240;
      }

      const canvas = captureCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Use toBlob instead of toDataURL for better main-thread performance
          canvas.toBlob((blob) => {
              if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                      const base64data = reader.result as string;
                      // Strip the data:image/jpeg;base64, part
                      onFrameCapture(base64data.split(',')[1]);
                  };
                  reader.readAsDataURL(blob);
              }
          }, 'image/jpeg', 0.6);
      }
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border-4 border-gray-800 bg-black shadow-2xl">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        playsInline
        muted
      />
      <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
        YOU
      </div>
    </div>
  );
};

export default CameraFeed;