import './ResultsScreen.css';

function ResultsScreen({ questions, userAnswers, onRestart, onRetryMissed }) {
  const correctCount = userAnswers.filter(
    (answer, index) => answer === questions[index].correctAnswer
  ).length;

  const totalQuestions = questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const missedQuestions = questions.filter(
    (question, index) => userAnswers[index] !== question.correctAnswer
  );

  const handleRetryMissed = () => {
    if (missedQuestions.length > 0) {
      onRetryMissed(missedQuestions);
    }
  };

  return (
    <div className="container">
      <div className="results-content">
        <h1 className="title">Quiz Complete</h1>

        <div className="score-box">
          <p className="score-text">
            You scored {correctCount} out of {totalQuestions}
          </p>
          <p className="percentage">{percentage}%</p>
        </div>

        {missedQuestions.length > 0 && (
          <div className="missed-section">
            <h2 className="section-title">Missed Words</h2>
            <div className="missed-list">
              {missedQuestions.map((question, index) => {
                const originalIndex = questions.findIndex(q => q.id === question.id);
                const userAnswer = userAnswers[originalIndex];
                
                return (
                  <div key={question.id} className="missed-item">
                    <div className="missed-word">{question.word}</div>
                    <div className="missed-sentence">{question.sentence}</div>
                    <div className="missed-answers">
                      <span className="wrong-answer">Your answer: {userAnswer}</span>
                      <span className="right-answer">Correct: {question.correctAnswer}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="results-actions">
          {missedQuestions.length > 0 && (
            <button className="button" onClick={handleRetryMissed}>
              Practice Missed Words ({missedQuestions.length})
            </button>
          )}
          <button className="button button-secondary" onClick={onRestart}>
            Start New Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;