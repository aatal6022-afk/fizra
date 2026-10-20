/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Exercise } from '../types/exercise';

export function generatePythonScriptForExercise(exercise: Exercise): string {
  return `"""
=============================================================================
 ПРОЕКТ ПО ФИЗИЧЕСКОЙ КУЛЬТУРЕ И БИОМЕХАНИКЕ
 Упражнение: ${exercise.name}
 Анализ техники с камеры в реальном времени: MediaPipe + OpenCV + Matplotlib
=============================================================================
Установка зависимостей:
    pip install opencv-python mediapipe numpy matplotlib
Запуск:
    python pe_biomechanics_tracker.py
=============================================================================
"""

import cv2
import mediapipe as mp
import numpy as np
import time
from collections import deque
import matplotlib.pyplot as plt

# --- ЭТАЛОННЫЕ БИОМЕХАНИЧЕСКИЕ ПОКАЗАТЕЛИ ДЛЯ УПРАЖНЕНИЯ ---
EXERCISE_NAME = "${exercise.name}"
TARGET_JOINT = "${exercise.targetJoint}"
TARGET_ANGLE = ${exercise.targetAngle}          # Идеальный угол сгибания в градусах
MIN_ACCEPTABLE = ${exercise.minAcceptableAngle}        # Нижняя граница допустимой нормы
MAX_ACCEPTABLE = ${exercise.maxAcceptableAngle}       # Верхняя граница допустимой нормы (недосед)
START_ANGLE = ${exercise.startAngle}           # Угол в исходной стойке (разгибание)

# Школьные нормативы для оценки:
NORM_GRADE_5 = ${exercise.normativeGrade5}
NORM_GRADE_4 = ${exercise.normativeGrade4}
NORM_GRADE_3 = ${exercise.normativeGrade3}

def calculate_angle(a, b, c):
    """
    Вычисляет угол в градусах между 3 точками в суставе B:
    a: [x, y]
    b: [x, y] - вершина (например, колено или локоть)
    c: [x, y]
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return round(angle, 1)

def main():
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles

    # Инициализация захвата веб-камеры
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Буфер для построения графика амплитуды в реальном времени
    history_length = 120
    angle_history = deque(maxlen=history_length)
    time_history = deque(maxlen=history_length)

    # Переменные счетчика повторений и фаз
    rep_counter = 0
    valid_reps = 0
    phase = "idle"  # idle -> inflection -> lockout
    min_angle_achieved = 180.0
    start_time = time.time()
    rep_scores = []

    with mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6) as pose:
        print(f"[СТАРТ] Трекинг упражнения: {EXERCISE_NAME}")
        print("Нажмите 'q' в окне видео для завершения и получения итогового отчета.")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("Ошибка доступа к веб-камере.")
                break

            # Зеркальное отображение для комфортного восприятия
            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            # Конвертация в RGB для MediaPipe
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image_rgb.flags.writeable = False
            results = pose.process(image_rgb)
            image_rgb.flags.writeable = True

            current_angle = None
            feedback = "Встаньте в кадр целиком"
            color_status = (200, 200, 200)

            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark

                # Отрисовка всех костей скелета (минималистичный стиль)
                mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp_drawing.DrawingSpec(color=(240, 240, 240), thickness=2, circle_radius=3),
                    connection_drawing_spec=mp_drawing.DrawingSpec(color=(180, 180, 180), thickness=2)
                )

                # Выбор суставов в зависимости от типа упражнения
                ${exercise.jointKey === 'knee' ? `
                # Коленный сустав (Таз - Колено - Голеностоп)
                hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y * h]
                knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y * h]
                ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y * h]
                current_angle = calculate_angle(hip, knee, ankle)
                joint_center = (int(knee[0]), int(knee[1]))
                ` : exercise.jointKey === 'elbow' ? `
                # Локтевой сустав (Плечо - Локоть - Запястье)
                shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y * h]
                elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y * h]
                wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y * h]
                current_angle = calculate_angle(shoulder, elbow, wrist)
                joint_center = (int(elbow[0]), int(elbow[1]))
                ` : `
                # Тазобедренный сустав и позвоночник (Плечо - Таз - Колено)
                shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y * h]
                hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y * h]
                knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x * w, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y * h]
                current_angle = calculate_angle(shoulder, hip, knee)
                joint_center = (int(hip[0]), int(hip[1]))
                `}

                # Сохраняем в буфер для анализа графика
                angle_history.append(current_angle)
                time_history.append(time.time() - start_time)

                # Проверка вхождения в эталонный диапазон амплитуды
                if MIN_ACCEPTABLE <= current_angle <= MAX_ACCEPTABLE:
                    color_status = (60, 200, 100)  # Зеленый (идеально)
                    feedback = "Отличная амплитуда!"
                elif current_angle < MIN_ACCEPTABLE:
                    color_status = (0, 165, 255)  # Оранжевый (глубже нормы)
                    feedback = "Слишком глубоко! Опасность для сустава"
                elif phase == "inflection" and current_angle > MAX_ACCEPTABLE:
                    color_status = (60, 60, 240)  # Красный (недосед)
                    feedback = "Опускайтесь ниже до эталона!"

                # Логика счетчика повторений
                if phase == "idle" and current_angle < (START_ANGLE - 20):
                    phase = "inflection"
                    min_angle_achieved = current_angle
                elif phase == "inflection":
                    min_angle_achieved = min(min_angle_achieved, current_angle)
                    if current_angle >= (START_ANGLE - 15):
                        # Повторение завершено
                        rep_counter += 1
                        is_valid = (min_angle_achieved <= MAX_ACCEPTABLE)
                        if is_valid:
                            valid_reps += 1
                            rep_scores.append(100)
                        else:
                            rep_scores.append(50)
                        phase = "idle"
                        min_angle_achieved = 180.0

                # Индикация угла прямо у сустава
                cv2.putText(frame, f"{int(current_angle)} deg", (joint_center[0] + 15, joint_center[1] - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color_status, 2)

            # Минималистичная панель HUD в верхнем левом углу
            cv2.rectangle(frame, (20, 20), (450, 180), (25, 25, 25), -1)
            cv2.rectangle(frame, (20, 20), (450, 180), (70, 70, 70), 1)

            cv2.putText(frame, EXERCISE_NAME[:35], (35, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 1)
            cv2.putText(frame, f"Счет повторений: {valid_reps} / {rep_counter}", (35, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (240, 240, 240), 2)
            cv2.putText(frame, f"Угол: {int(current_angle) if current_angle else '--'} deg (Эталон: {TARGET_ANGLE} deg)", (35, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
            cv2.putText(frame, f"Подсказка: {feedback}", (35, 152), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color_status, 1)

            cv2.imshow("PE Biomechanics Tracker", frame)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

    # --- ИТОГОВЫЙ ГРАФИК И ОЦЕНКА ПО ФИЗКУЛЬТУРЕ ---
    if len(angle_history) > 10:
        plt.figure(figsize=(10, 5))
        plt.style.use('dark_background')
        plt.plot(list(time_history), list(angle_history), color='#38bdf8', label='Текущая траектория сустава')
        plt.axhspan(MIN_ACCEPTABLE, MAX_ACCEPTABLE, color='#22c55e', alpha=0.25, label=f'Эталонный коридор ({MIN_ACCEPTABLE}..{MAX_ACCEPTABLE} deg)')
        plt.axhline(TARGET_ANGLE, color='#22c55e', linestyle='--', label=f'Идеальный угол {TARGET_ANGLE} deg')
        plt.title(f"Биомеханический анализ амплитуды: {EXERCISE_NAME}")
        plt.xlabel("Время (сек)")
        plt.ylabel("Угол сгибания (градусы)")
        plt.legend(loc='upper right')
        plt.grid(True, alpha=0.2)
        plt.tight_layout()
        plt.show()

    # Оценка зачета
    grade = 2
    if valid_reps >= NORM_GRADE_5:
        grade = 5
    elif valid_reps >= NORM_GRADE_4:
        grade = 4
    elif valid_reps >= NORM_GRADE_3:
        grade = 3

    print("=====================================================")
    print(f"ИТОГОВЫЙ ОТЧЕТ ПО УПРАЖНЕНИЮ: {EXERCISE_NAME}")
    print(f"Всего повторений: {rep_counter}")
    print(f"Засчитано по нормативу (с правильной амплитудой): {valid_reps}")
    print(f"Оценка по физкультуре: {grade} (Нормативы: 5 — {NORM_GRADE_5}, 4 — {NORM_GRADE_4}, 3 — {NORM_GRADE_3})")
    print("=====================================================")

if __name__ == "__main__":
    main()
`;
}
