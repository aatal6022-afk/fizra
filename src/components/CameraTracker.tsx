/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Exercise, RepetitionLog } from '../types/exercise';
import { calculateAngle, ExerciseRepetitionTracker } from '../utils/biomechanics';
import { LiveTelemetryChart } from './LiveTelemetryChart';
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Code,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  Send,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface HomeworkContext {
  assignmentId: string;
  classCode: string;
  className: string;
  studentName: string;
  targetReps: number;
  minAccuracy: number;
}

interface CameraTrackerProps {
  exercise: Exercise;
  onClose: () => void;
  onFinishWorkout: (summary: {
    exercise: Exercise;
    totalReps: number;
    validReps: number;
    invalidReps: number;
    averageAngle: number;
    symmetryScore: number;
    durationSeconds: number;
    repLogs: RepetitionLog[];
    homeworkContext?: HomeworkContext;
  }) => void;
  onOpenPythonModal: (exercise: Exercise) => void;
  homeworkContext?: HomeworkContext;
}

export const CameraTracker: React.FC<CameraTrackerProps> = ({
  exercise,
  onClose,
  onFinishWorkout,
  onOpenPythonModal,
  homeworkContext,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackerRef = useRef<ExerciseRepetitionTracker>(new ExerciseRepetitionTracker(exercise));
  const poseRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);

  // Status state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPoseModelLoaded, setIsPoseModelLoaded] = useState<boolean>(false);

  // Live telemetry state
  const [currentAngle, setCurrentAngle] = useState<number>(exercise.startAngle);
  const [angleHistory, setAngleHistory] = useState<number[]>([]);
  const [repsCount, setRepsCount] = useState<{ total: number; valid: number; invalid: number }>({
    total: 0,
    valid: 0,
    invalid: 0,
  });
  const [feedbackCue, setFeedbackCue] = useState<string>('Встаньте перед камерою на відстані 2 метрів');
  const [isInsideOptimal, setIsInsideOptimal] = useState<boolean>(false);
  const [repLogs, setRepLogs] = useState<RepetitionLog[]>([]);
  const [symmetryScore, setSymmetryScore] = useState<number>(92);
  const [durationSec, setDurationSec] = useState<number>(0);

  // Web Audio chime for repetition confirmation
  const playBeep = useCallback((isSuccess: boolean) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = isSuccess ? 880 : 360;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch {
      // AudioContext unavailable
    }
  }, [soundEnabled]);

  // Workout duration timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Initialize REAL Camera & MediaPipe Pose Engine
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
        };
      }
    } catch (err: any) {
      console.warn('Real camera error:', err);
      setCameraError('Не вдалося отримати доступ до камери. Надайте дозвіл у браузері або завантажте відеофайл.');
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (cameraInstanceRef.current) {
        cameraInstanceRef.current.stop?.();
      }
    };
  }, [startCamera]);

  // Setup MediaPipe Pose directly
  useEffect(() => {
    let animId: number;

    const initMediaPipe = async () => {
      if (typeof (window as any).Pose !== 'undefined') {
        try {
          const pose = new (window as any).Pose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });

          pose.onResults(handlePoseResults);
          poseRef.current = pose;
          setIsPoseModelLoaded(true);

          const processFrame = async () => {
            if (
              videoRef.current &&
              videoRef.current.readyState >= 2 &&
              poseRef.current &&
              isRunning
            ) {
              try {
                await poseRef.current.send({ image: videoRef.current });
              } catch (e) {
                // Frame skip
              }
            }
            animId = requestAnimationFrame(processFrame);
          };

          animId = requestAnimationFrame(processFrame);
        } catch (e) {
          console.warn('MediaPipe Pose setup notice:', e);
        }
      }
    };

    const timer = setTimeout(initMediaPipe, 500);
    return () => {
      clearTimeout(timer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isRunning]);

  // MediaPipe Results Handler (processes REAL user body landmarks)
  const handlePoseResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Draw real mirrored video frame
    if (results.image) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(results.image, 0, 0, w, h);
      ctx.restore();
    }

    if (!results.poseLandmarks) {
      setFeedbackCue('Встаньте в кадр у повний зріст');
      return;
    }

    const lm = results.poseLandmarks;

    // Draw real skeletal connections (clean silver-white style, no tacky neon)
    const CONNECTIONS = [
      [11, 12], // shoulders
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], // torso sides
      [23, 24], // hips
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28], // right leg
    ];

    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    CONNECTIONS.forEach(([i, j]) => {
      const p1 = lm[i];
      const p2 = lm[j];
      if (p1 && p2 && (p1.visibility ?? 1) > 0.5 && (p2.visibility ?? 1) > 0.5) {
        // Mirrored X coordinates
        const x1 = (1 - p1.x) * w;
        const y1 = p1.y * h;
        const x2 = (1 - p2.x) * w;
        const y2 = p2.y * h;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // Draw joint dots
    lm.forEach((pt: any) => {
      if ((pt.visibility ?? 1) > 0.5) {
        const x = (1 - pt.x) * w;
        const y = pt.y * h;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Calculate real mathematical joint angles based on chosen exercise
    let measuredAngle = exercise.startAngle;
    let targetX = w / 2;
    let targetY = h / 2;

    if (exercise.jointKey === 'knee') {
      // Right Knee (24 Hip, 26 Knee, 28 Ankle) or Left Knee (23, 25, 27)
      const rHip = lm[24];
      const rKnee = lm[26];
      const rAnkle = lm[28];
      const lHip = lm[23];
      const lKnee = lm[25];
      const lAnkle = lm[27];

      if (rHip && rKnee && rAnkle) {
        const rAngle = calculateAngle(rHip, rKnee, rAnkle);
        measuredAngle = rAngle;
        targetX = (1 - rKnee.x) * w;
        targetY = rKnee.y * h;

        if (lHip && lKnee && lAnkle) {
          const lAngle = calculateAngle(lHip, lKnee, lAnkle);
          const diff = Math.abs(rAngle - lAngle);
          setSymmetryScore(Math.max(60, Math.round(100 - diff * 2)));
        }
      }
    } else if (exercise.jointKey === 'elbow') {
      // Right Elbow (12 Shoulder, 14 Elbow, 16 Wrist)
      const rShoulder = lm[12];
      const rElbow = lm[14];
      const rWrist = lm[16];
      if (rShoulder && rElbow && rWrist) {
        measuredAngle = calculateAngle(rShoulder, rElbow, rWrist);
        targetX = (1 - rElbow.x) * w;
        targetY = rElbow.y * h;
      }
    } else {
      // Hip / Spine (12 Shoulder, 24 Hip, 26 Knee)
      const rShoulder = lm[12];
      const rHip = lm[24];
      const rKnee = lm[26];
      if (rShoulder && rHip && rKnee) {
        measuredAngle = calculateAngle(rShoulder, rHip, rKnee);
        targetX = (1 - rHip.x) * w;
        targetY = rHip.y * h;
      }
    }

    // Highlight target joint with live angle box
    const isOptimal = measuredAngle >= exercise.minAcceptableAngle && measuredAngle <= exercise.maxAcceptableAngle;

    ctx.fillStyle = '#000000';
    ctx.fillRect(targetX + 10, targetY - 14, 60, 22);
    ctx.strokeStyle = isOptimal ? '#22c55e' : '#525252';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(targetX + 10, targetY - 14, 60, 22);

    ctx.fillStyle = isOptimal ? '#22c55e' : '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${Math.round(measuredAngle)}°`, targetX + 16, targetY + 2);

    // Update state machine
    const res = trackerRef.current.update(measuredAngle);
    setCurrentAngle(measuredAngle);
    setIsInsideOptimal(res.isInsideOptimalRange);
    setFeedbackCue(res.feedbackCue);

    if (res.repCompleted) {
      setRepLogs((prev) => [...prev, res.repCompleted!]);
      playBeep(res.repCompleted.isSuccessful);
    }

    setRepsCount(trackerRef.current.getCounts());

    setAngleHistory((prev) => {
      const next = [...prev, measuredAngle];
      return next.length > 80 ? next.slice(-80) : next;
    });
  };

  // Video File Upload Support (Real video analysis)
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !videoRef.current) return;
    const url = URL.createObjectURL(file);
    videoRef.current.srcObject = null;
    videoRef.current.src = url;
    videoRef.current.loop = true;
    videoRef.current.play();
    setCameraActive(true);
    setCameraError(null);
  };

  const handleReset = () => {
    trackerRef.current.reset(exercise);
    setRepsCount({ total: 0, valid: 0, invalid: 0 });
    setRepLogs([]);
    setAngleHistory([]);
    setDurationSec(0);
    setFeedbackCue('Скинуто до вихідного');
  };

  const handleComplete = () => {
    setIsRunning(false);
    const avgAngle = angleHistory.length > 0
      ? angleHistory.reduce((a, b) => a + b, 0) / angleHistory.length
      : exercise.targetAngle;

    onFinishWorkout({
      exercise,
      totalReps: repsCount.total,
      validReps: repsCount.valid,
      invalidReps: repsCount.invalid,
      averageAngle: Math.round(avgAngle),
      symmetryScore,
      durationSeconds: Math.max(durationSec, 5),
      repLogs,
      homeworkContext,
    });
  };

  const accuracyPercent = repsCount.total > 0
    ? Math.round((repsCount.valid / repsCount.total) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3 bg-neutral-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Повернутися"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-100 truncate max-w-[200px] sm:max-w-md">
                {exercise.name}
              </h2>
              {homeworkContext && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono">
                  <GraduationCap className="w-3 h-3" />
                  ДЗ: {homeworkContext.className} ({homeworkContext.studentName})
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              Реальний трекінг: {exercise.targetJoint} • Еталон {exercise.targetAngle}°
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-xs"
            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          <button
            onClick={() => onOpenPythonModal(exercise)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-300 hover:text-neutral-100 font-mono"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Python код</span>
          </button>

          <button
            onClick={handleComplete}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{homeworkContext ? 'Здати ДЗ' : 'Отримати звіт AI'}</span>
          </button>
        </div>
      </div>

      {/* Homework Target Banner if student mode */}
      {homeworkContext && (
        <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <span className="text-emerald-300">
            Норматив: виконати {homeworkContext.targetReps} повторень (точність ≥{homeworkContext.minAccuracy}%)
          </span>
          <span className={`font-bold ${repsCount.valid >= homeworkContext.targetReps && accuracyPercent >= homeworkContext.minAccuracy ? 'text-emerald-400' : 'text-amber-400'}`}>
            Зроблено: {repsCount.valid} / {homeworkContext.targetReps} ({accuracyPercent}% точність)
          </span>
        </div>
      )}

      {/* Main Viewport Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Real Webcam / Video Feed with Overlay */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-[300px]">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain -scale-x-100"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="relative z-10 w-full h-full object-contain max-h-[70vh] lg:max-h-full"
          />

          {/* Real-time Telemetry Floating HUD */}
          <div className="absolute top-4 left-4 z-20 p-3 rounded-xl bg-neutral-950/85 border border-neutral-800/80 backdrop-blur-md font-mono text-xs space-y-1.5 pointer-events-none">
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Кут у суглобі</div>
            <div className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
              <span>{Math.round(currentAngle)}°</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded border ${
                isInsideOptimal
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400'
              }`}>
                {isInsideOptimal ? 'В еталоні' : 'Відхилення'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Статус: <strong className={isInsideOptimal ? 'text-emerald-400' : 'text-neutral-200'}>{feedbackCue}</strong>
            </div>
          </div>

          {/* Floating Reps counter on video */}
          <div className="absolute top-4 right-4 z-20 p-3 rounded-xl bg-neutral-950/85 border border-neutral-800/80 backdrop-blur-md font-mono text-right pointer-events-none">
            <div className="text-[10px] text-neutral-400 uppercase">Зараховано</div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {repsCount.valid} <span className="text-sm font-normal text-neutral-400">/ {repsCount.total}</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Точність: {accuracyPercent}%
            </div>
          </div>

          {/* Bottom Bar on Video: Real Camera Switch / Video Upload */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 backdrop-blur-md"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Перезапустити камеру</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950/90 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 cursor-pointer backdrop-blur-md">
              <Upload className="w-3.5 h-3.5 text-neutral-400" />
              <span>Аналізувати відеофайл</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>

          {cameraError && (
            <div className="absolute bottom-16 left-4 right-4 z-30 p-3 rounded-xl bg-neutral-950/95 border border-amber-500/40 text-amber-300 text-xs text-center backdrop-blur-md">
              {cameraError}
            </div>
          )}
        </div>

        {/* Right Telemetry & Controls Sidebar */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900/40 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          
          <div className="space-y-4">
            {/* Real-time Rolling Telemetry Chart */}
            <LiveTelemetryChart
              angleHistory={angleHistory}
              targetAngle={exercise.targetAngle}
              minAcceptableAngle={exercise.minAcceptableAngle}
              maxAcceptableAngle={exercise.maxAcceptableAngle}
              currentAngle={currentAngle}
              jointName={exercise.targetJoint.split(' ')[0]}
            />

            {/* Rep Counter Metrics Card */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Біомеханічні метрики</span>
                <span>Час: {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[9px] text-neutral-500 uppercase">Всього</div>
                  <div className="text-lg font-bold text-neutral-100">{repsCount.total}</div>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900 border border-emerald-500/30">
                  <div className="text-[9px] text-emerald-400 uppercase">В нормі</div>
                  <div className="text-lg font-bold text-emerald-400">{repsCount.valid}</div>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[9px] text-neutral-500 uppercase">Брак</div>
                  <div className="text-lg font-bold text-rose-400">{repsCount.invalid}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1 border-t border-neutral-800/80">
                <div className="flex justify-between text-neutral-400">
                  <span>Симетрія сторін:</span>
                  <span className="text-neutral-200 font-semibold">{symmetryScore}%</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Шкільний норматив «5»:</span>
                  <span className="text-neutral-200 font-semibold">{exercise.normativeGrade5} {exercise.unit}</span>
                </div>
              </div>
            </div>

            {/* Criteria */}
            <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/60 text-xs text-neutral-300 space-y-1.5">
              <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Критерії заліку техніки:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px]">
                {exercise.keyCheckpoints.slice(0, 3).map((cp, idx) => (
                  <li key={idx}>{cp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                  isRunning
                    ? 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white'
                    : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? 'Пауза' : 'Продовжити'}</span>
              </button>

              <button
                onClick={handleReset}
                className="py-2 px-3 rounded-lg text-xs font-medium border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Скинути</span>
              </button>
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              {homeworkContext ? (
                <>
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Завершити та надіслати у журнал вчителя</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Завершити та сформувати звіт AI</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
