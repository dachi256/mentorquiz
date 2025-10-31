import { useState } from 'react';
import quizData from '../quiz-data.json';
import './StartScreen.css';

function StartScreen({ onStart }) {
  const [selectedLessons, setSelectedLessons] = useState([]);

  const lessons = [
    { id: 'lesson1', name: 'Lesson 1', count: 5 },
    { id: 'lesson2', name: 'Lesson 2', count: 5 },
    { id: 'lesson3', name: 'Lesson 3', count: 10 },
    { id: 'lesson4', name: 'Lesson 4', count: 15 },
  ];

  const toggleLesson = (lessonId) => {
    if (lessonId === 'all') {
      if (selectedLessons.length === 4) {
        setSelectedLessons([]);
      } else {
        setSelectedLessons(['lesson1', 'lesson2', 'lesson3', 'lesson4']);
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

    onStart(shuffledQuestions);
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

  const allSelected = selectedLessons.length === 4;

  return (
    <div className="container">
      <h1 className="title">SAT Vocabulary Quiz</h1>
      
      <div className="lesson-selection">
        <p className="subtitle">Select lessons to practice:</p>
        
        <div className="checkbox-list">
          {lessons.map(lesson => (
            <label key={lesson.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={selectedLessons.includes(lesson.id)}
                onChange={() => toggleLesson(lesson.id)}
              />
              <span>{lesson.name} ({lesson.count} words)</span>
            </label>
          ))}
          
          <label className="checkbox-item checkbox-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => toggleLesson('all')}
            />
            <span>All Lessons (35 words)</span>
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