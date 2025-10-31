import './FeedbackScreen.css';

function FeedbackScreen({ question, userAnswer, onNext }) {
  const isCorrect = userAnswer === question.correctAnswer;

  return (
    <div className="container">
      <div className="feedback-content">
        <div className={`feedback-header ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? 'Correct' : 'Incorrect'}
        </div>

        {!isCorrect && (
          <div className="answer-comparison">
            <p className="user-answer">
              <span className="label">Your answer:</span> {userAnswer}
            </p>
            <p className="correct-answer">
              <span className="label">Correct answer:</span> {question.correctAnswer}
            </p>
          </div>
        )}

        {isCorrect && (
          <div className="correct-word">
            {question.word}
          </div>
        )}

        <div className="definition-box">
          <p className="definition-label">Definition</p>
          <p className="definition-text">{question.definition}</p>
        </div>

        <button className="button" onClick={onNext}>
          Next Question
        </button>
      </div>
    </div>
  );
}

export default FeedbackScreen;