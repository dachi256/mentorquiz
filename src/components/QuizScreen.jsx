import { useState } from 'react';
import './QuizScreen.css';

function QuizScreen({ question, questionNumber, totalQuestions, onSubmit }) {
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const handleSubmit = () => {
    if (selectedAnswer) {
      onSubmit(selectedAnswer);
    }
  };

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="container">
      <div className="quiz-header">
        <p className="question-counter">
          Question {questionNumber} of {totalQuestions}
        </p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="question-content">
        <p className="question-sentence">
          {question.sentence}
        </p>

        <div className="options-list">
          {question.options.map((option) => (
            <label key={option} className="option-item">
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => setSelectedAnswer(e.target.value)}
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>

        <button
          className="button"
          onClick={handleSubmit}
          disabled={!selectedAnswer}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}

export default QuizScreen;