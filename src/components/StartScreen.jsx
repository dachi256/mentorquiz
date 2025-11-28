import { useState, useEffect } from 'react';
import quizData from '../quiz-data.json';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './StartScreen.css';

function StartScreen({ onStart }) {
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [masteredLessons, setMasteredLessons] = useState([]);
  const { user } = useAuth();

  const lessons = [
    { id: 'lesson1', name: 'Lesson 1', count: 5 },
    { id: 'lesson2', name: 'Lesson 2', count: 5 },
    { id: 'lesson3', name: 'Lesson 3', count: 10 },
    { id: 'lesson4', name: 'Lesson 4', count: 15 },
    { id: 'lesson5', name: 'Lesson 5', count: 10 },
  ];

  // Fetch progress on mount
  useEffect(() => {
    async function fetchMastery() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('mastered_lessons')
        .eq('id', user.id)
        .single();
      
      setMasteredLessons(data?.mastered_lessons || []);
    }
    fetchMastery();
  }, [user]);

  // Helper to check if locked
  const isLessonLocked = (index) => {
    if (index === 0) return false; // Lesson 1 is always open
    const prevLessonId = lessons[index - 1].id;
    // Locked if previous lesson is NOT in mastered list
    return !masteredLessons.includes(prevLessonId);
  };

  const toggleLesson = (lessonId) => {
    if (lessonId === 'all') {
      if (selectedLessons.length === 5) {
        setSelectedLessons([]);
      } else {
        setSelectedLessons(['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5']);
      }
    } else {
      if (selectedLessons.includes(lessonId)) {
        setSelectedLessons(selectedLessons.filter(id => id !== lessonId));
      } else {
        setSelectedLessons([...selectedLessons, lessonId]);
      }
    }
  };

  const handleStart = () => {
    let questionIds = [];
    selectedLessons.forEach(lessonId => {
      questionIds = [...questionIds, ...quizData.metadata.lessons[lessonId]];
    });

    const selectedQuestions = quizData.questions.filter(q => 
      questionIds.includes(q.id)
    );

    const shuffledQuestions = selectedQuestions
      .map(q => ({
        ...q,
        options: shuffleArray([...q.options])
      }))
      .sort(() => Math.random() - 0.5);

    // Pass both questions and selected lessons to parent
    onStart(shuffledQuestions, selectedLessons);
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const totalQuestions = selectedLessons.reduce((sum, lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return sum + (lesson ? lesson.count : 0);
  }, 0);

  const allSelected = selectedLessons.length === 5;

  return (
    <div className="container">
      <h1 className="title">SAT Vocabulary Quiz</h1>
      
      <div className="lesson-selection">
        <p className="subtitle">Select lessons to practice:</p>
        
        <div className="checkbox-list">
          {lessons.map((lesson, index) => {
            const locked = isLessonLocked(index);
            
            return (
              <label 
                key={lesson.id} 
                className={`checkbox-item ${locked ? 'locked' : ''}`}
                style={locked ? { opacity: 0.6, cursor: 'not-allowed', background: '#f1f5f9' } : {}}
              >
                <input
                  type="checkbox"
                  checked={selectedLessons.includes(lesson.id)}
                  onChange={() => !locked && toggleLesson(lesson.id)}
                  disabled={locked}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span>{lesson.name} ({lesson.count} words)</span>
                  
                  {/* Show Lock Icon or Checkmark */}
                  {locked ? (
                    <span style={{ fontSize: '18px' }}>🔒</span>
                  ) : masteredLessons.includes(lesson.id) ? (
                    <span style={{ fontSize: '18px', color: '#22c55e' }}>✅</span>
                  ) : null}
                </div>
              </label>
            );
          })}
          
          <label className="checkbox-item checkbox-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => toggleLesson('all')}
            />
            <span>All Lessons (45 words)</span>
          </label>
        </div>
        
        {totalQuestions > 0 && (
          <p className="question-count">
            {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} selected
          </p>
        )}
        
        <button
          className="button"
          onClick={handleStart}
          disabled={selectedLessons.length === 0}
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
}

export default StartScreen;