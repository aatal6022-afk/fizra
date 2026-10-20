/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { dbManager } from './src/db/storage';
import { Exercise } from './src/types/exercise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client instance
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// --- EXERCISES DATABASE ENDPOINTS ---

app.get('/api/exercises', (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const exercises = dbManager.getExercises(query, category);
    return res.json({ success: true, count: exercises.length, data: exercises });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Помилка завантаження вправ' });
  }
});

app.get('/api/exercises/:id', (req: Request, res: Response) => {
  try {
    const exercise = dbManager.getExerciseById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Вправу не знайдено' });
    }
    return res.json({ success: true, data: exercise });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/exercises', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      targetMuscleGroups,
      videoUrl,
      modifications,
      category,
      categoryName,
      difficulty,
      targetJoint,
      jointKey,
      targetAngle,
      minAcceptableAngle,
      maxAcceptableAngle,
      startAngle,
      unit,
      normativeGrade5,
      normativeGrade4,
      normativeGrade3,
      keyCheckpoints,
      commonMistakes,
      peBenchmarkTip,
      tags,
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Назва та опис обов’язкові' });
    }

    const newExercise: Exercise = {
      id: `ex-custom-${Date.now()}`,
      name,
      description,
      targetMuscleGroups: Array.isArray(targetMuscleGroups) ? targetMuscleGroups : [targetMuscleGroups].filter(Boolean),
      videoUrl: videoUrl || '',
      modifications: Array.isArray(modifications) ? modifications : [modifications].filter(Boolean),
      category: category || 'calisthenics',
      categoryName: categoryName || 'ОФП і Власна вага',
      difficulty: difficulty || 'Базовий',
      targetJoint: targetJoint || 'Колінний суглоб',
      jointKey: jointKey || 'knee',
      targetAngle: Number(targetAngle) || 90,
      minAcceptableAngle: Number(minAcceptableAngle) || 80,
      maxAcceptableAngle: Number(maxAcceptableAngle) || 100,
      startAngle: Number(startAngle) || 175,
      unit: unit || 'повторений',
      normativeGrade5: Number(normativeGrade5) || 25,
      normativeGrade4: Number(normativeGrade4) || 20,
      normativeGrade3: Number(normativeGrade3) || 15,
      keyCheckpoints: keyCheckpoints || ['Контролюйте амплітуду руху'],
      commonMistakes: commonMistakes || ['Неповна амплітуда згинання'],
      peBenchmarkTip: peBenchmarkTip || '',
      tags: tags || ['користувацьке', 'офп'],
    };

    const saved = dbManager.addExercise(newExercise);
    return res.json({ success: true, data: saved });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- CLASSROOM & TEACHER / STUDENT MODE ENDPOINTS ---

// GET /api/classes: List all classes
app.get('/api/classes', (_req: Request, res: Response) => {
  try {
    const classes = dbManager.getAllClasses();
    return res.json({ success: true, data: classes });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/classes: Teacher creates class
app.post('/api/classes', (req: Request, res: Response) => {
  try {
    const { name, teacherName } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Введіть назву класу (наприклад, 7-А клас)' });
    }
    const created = dbManager.createClass(name, teacherName);
    return res.json({ success: true, data: created });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/classes/:code: Student or Teacher gets class details by code
app.get('/api/classes/:code', (req: Request, res: Response) => {
  try {
    const cls = dbManager.getClassByCode(req.params.code);
    if (!cls) {
      return res.status(404).json({ error: 'Клас із таким кодом не знайдено. Перевірте код доступу.' });
    }
    return res.json({ success: true, data: cls });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/classes/:code/assignments: Teacher creates homework
app.post('/api/classes/:code/assignments', (req: Request, res: Response) => {
  try {
    const { exerciseId, exerciseName, targetReps, minAccuracy, deadline, instructions } = req.body;
    if (!exerciseName || !targetReps) {
      return res.status(400).json({ error: 'Оберіть вправу та кількість повторень' });
    }
    const assignment = dbManager.createAssignment(req.params.code, {
      exerciseId: exerciseId || 'unknown',
      exerciseName,
      targetReps: Number(targetReps) || 20,
      minAccuracy: Number(minAccuracy) || 85,
      deadline: deadline || '2026-10-30',
      instructions: instructions || 'Виконувати з дотриманням техніки та прямого кута.',
    });
    if (!assignment) {
      return res.status(404).json({ error: 'Клас не знайдено' });
    }
    return res.json({ success: true, data: assignment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/classes/:code/submissions: Teacher gradebook / dashboard
app.get('/api/classes/:code/submissions', (req: Request, res: Response) => {
  try {
    const submissions = dbManager.getSubmissions(req.params.code);
    return res.json({ success: true, data: submissions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/submissions: Student sends homework results directly to teacher's journal
app.post('/api/submissions', (req: Request, res: Response) => {
  try {
    const {
      assignmentId,
      classCode,
      studentName,
      exerciseName,
      completedReps,
      validReps,
      targetReps,
      accuracyPercent,
      isPassed,
      grade,
      averageAmplitude,
      tempoSpeed,
      aiVerdict,
      technicalErrors,
      positiveAspects,
    } = req.body;

    if (!classCode || !studentName) {
      return res.status(400).json({ error: 'Вкажіть код класу та Прізвище ім’я учня' });
    }

    const submission = dbManager.submitHomework({
      assignmentId: assignmentId || '',
      classCode: classCode.trim().toUpperCase(),
      studentName: studentName.trim(),
      exerciseName: exerciseName || 'Вправа',
      completedReps: Number(completedReps) || 0,
      validReps: Number(validReps) || 0,
      targetReps: Number(targetReps) || 0,
      accuracyPercent: Number(accuracyPercent) || 0,
      isPassed: Boolean(isPassed),
      grade: Number(grade) || 3,
      averageAmplitude: Number(averageAmplitude) || 0,
      tempoSpeed: Number(tempoSpeed) || 0,
      aiVerdict: aiVerdict || 'ДЗ виконано',
      technicalErrors: technicalErrors || [],
      positiveAspects: positiveAspects || [],
    });

    return res.json({ success: true, data: submission });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- WORKOUT HISTORY ENDPOINTS ---

app.get('/api/history', (_req: Request, res: Response) => {
  try {
    const history = dbManager.getHistory();
    return res.json({ success: true, data: history });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/history', (req: Request, res: Response) => {
  try {
    const {
      exerciseId,
      exerciseName,
      categoryName,
      averageAmplitude,
      targetAmplitude,
      tempoSpeed,
      totalReps,
      validReps,
      symmetryScore,
      durationSeconds,
      overallVerdict,
      grade,
      aiReport,
    } = req.body;

    const savedItem = dbManager.addHistoryItem({
      exerciseId: exerciseId || 'unknown',
      exerciseName: exerciseName || 'Вправа',
      categoryName: categoryName || 'ОФП',
      averageAmplitude: Number(averageAmplitude) || 0,
      targetAmplitude: Number(targetAmplitude) || 90,
      tempoSpeed: Number(tempoSpeed) || 0,
      totalReps: Number(totalReps) || 0,
      validReps: Number(validReps) || 0,
      symmetryScore: Number(symmetryScore) || 100,
      durationSeconds: Number(durationSeconds) || 0,
      overallVerdict: overallVerdict || 'Тренування завершено',
      grade: Number(grade) || 3,
      aiReport,
    });

    return res.json({ success: true, data: savedItem });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- GEMINI TECHNIQUE ANALYSIS ---

app.post('/api/analyze-technique', async (req: Request, res: Response) => {
  try {
    const {
      exerciseId,
      exerciseName,
      categoryName,
      targetJoint,
      targetAngle,
      minAcceptableAngle,
      maxAcceptableAngle,
      totalReps,
      validReps,
      invalidReps,
      averageAngleAchieved,
      symmetryScore,
      durationSeconds,
      repLogs,
    } = req.body;

    const tempoSpeed = totalReps > 0 ? Math.round((durationSeconds / totalReps) * 10) / 10 : 0;
    let aiReportData: any = null;
    let source = 'heuristic';

    if (ai) {
      try {
        const prompt = `
Ти досвідчений вчитель фізичної культури та експерт зі спортивної біомеханіки.
Учень виконав вправу: "${exerciseName}".
Цільовий суглоб: ${targetJoint}.
Еталонна амплітуда: ${targetAngle}° (допустимий коридор: ${minAcceptableAngle}° - ${maxAcceptableAngle}°).

Дані сенсорів і камери:
- Всього повторень: ${totalReps}
- Зараховано з еталонною амплітудою: ${validReps}
- Повторень із порушенням техніки: ${invalidReps}
- Середній кут суглоба: ${Math.round(averageAngleAchieved)}°
- Темп: ${tempoSpeed} сек/повт
- Симетрія: ${symmetryScore}%
- Тривалість: ${durationSeconds} сек

Дай детальний, чесний аналіз техніки зрозумілою людською мовою (без заумних слів, чітко що робити тілу), вистави шкільну оцінку (2..5) та рекомендації для заліку.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Відповідай структуровано у форматі JSON. Мова — українська. Формулювання чіткі, практичні та доброзичливі.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                grade: { type: Type.INTEGER, description: 'Шкільна оцінка: 2, 3, 4 або 5' },
                summary: { type: Type.STRING, description: 'Короткий вердикт виконання' },
                positiveAspects: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Що зроблено правильно' },
                technicalErrors: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Помилки та відхилення' },
                humanLanguageCorrections: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Що виправити людською мовою' },
                peTeacherComment: { type: Type.STRING, description: 'Коментар вчителя' },
                biomechanicalBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    amplitudeCompliance: { type: Type.STRING },
                    tempoControl: { type: Type.STRING },
                    jointSafety: { type: Type.STRING },
                  },
                  required: ['amplitudeCompliance', 'tempoControl', 'jointSafety'],
                },
              },
              required: [
                'grade',
                'summary',
                'positiveAspects',
                'technicalErrors',
                'humanLanguageCorrections',
                'peTeacherComment',
                'biomechanicalBreakdown',
              ],
            },
          },
        });

        const responseText = response.text;
        if (responseText) {
          aiReportData = JSON.parse(responseText.trim());
          source = 'gemini';
        }
      } catch (geminiErr) {
        console.warn('Gemini error, fallback to heuristic:', geminiErr);
      }
    }

    if (!aiReportData) {
      const successRatio = totalReps > 0 ? validReps / totalReps : 0;
      let fallbackGrade = 3;
      if (successRatio >= 0.85 && totalReps >= 15) fallbackGrade = 5;
      else if (successRatio >= 0.7 && totalReps >= 10) fallbackGrade = 4;
      else if (successRatio >= 0.5) fallbackGrade = 3;
      else fallbackGrade = 2;

      aiReportData = {
        grade: fallbackGrade,
        summary: `Виконано ${totalReps} повторень, із них ${validReps} з еталонною амплітудою. Точність техніки: ${Math.round(successRatio * 100)}%.`,
        positiveAspects: [
          'Стабільне утримання вихідного положення',
          `Симетрія роботи сторін тіла: ${symmetryScore}%`,
          'Чітке розгинання у верхній точці',
        ],
        technicalErrors: invalidReps > 0 ? [
          `Зафіксовано ${invalidReps} повторень із неповною амплітудою (відхилення від ${targetAngle}°)`,
          'Прискорення темпу через втому',
        ] : [
          'Незначне коливання корпусу в нижній точці',
        ],
        humanLanguageCorrections: [
          `Не поспішай: опустися до прямого кута (${targetAngle}°), затримайся на півсекунди і плавно піднімайся.`,
          'Дивись прямо перед собою, не опускай підборіддя на груди — спина буде рівнішою.',
          'Дихай рівно: вдих при опусканні, видих при підйомі.',
        ],
        peTeacherComment: fallbackGrade >= 4
          ? 'Відмінна робота! Норматив зараховано.'
          : 'Потрібно попрацювати над глибиною амплітуди.',
        biomechanicalBreakdown: {
          amplitudeCompliance: `${Math.round(successRatio * 100)}% повторень у діапазоні ${minAcceptableAngle}..${maxAcceptableAngle}°`,
          tempoControl: `Середній темп: ${tempoSpeed} сек/повт`,
          jointSafety: symmetryScore >= 80 ? 'Безпечний осьовий розподіл навантаження' : 'Увага на симетрію навантаження',
        },
      };
    }

    const historyItem = dbManager.addHistoryItem({
      exerciseId: exerciseId || 'unknown',
      exerciseName,
      categoryName: categoryName || 'ОФП',
      averageAmplitude: Math.round(averageAngleAchieved),
      targetAmplitude: targetAngle,
      tempoSpeed,
      totalReps,
      validReps,
      symmetryScore,
      durationSeconds,
      overallVerdict: aiReportData.summary,
      grade: aiReportData.grade,
      aiReport: aiReportData,
    });

    return res.json({
      success: true,
      report: aiReportData,
      source,
      historyItem,
    });
  } catch (error: any) {
    console.error('Error generating analysis:', error);
    return res.status(500).json({ error: error.message || 'Помилка сервера' });
  }
});

// Setup Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер ФІЗ-АНАЛІЗ запущено на http://localhost:${PORT}`);
  });
}

setupServer();
