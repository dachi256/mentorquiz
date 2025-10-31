import { useState } from 'react';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import FeedbackScreen from './components/FeedbackScreen';
import ResultsScreen from './components/ResultsScreen';
import './App.css';

function App() {
  const [screen, setScreen] = useState('start');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  const startQuiz = (quizQuestions) => {
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setCurrentAnswer(null);
    setScreen('quiz');
  };

  const submitAnswer = (answer) => {
    setCurrentAnswer(answer);
    setScreen('feedback');
  };

  const nextQuestion = () => {
    const newAnswers = [...userAnswers, currentAnswer];
    setUserAnswers(newAnswers);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(null);
      setScreen('quiz');
    } else {
      setScreen('results');
    }
  };

  const restartQuiz = () => {
    setScreen('start');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setCurrentAnswer(null);
  };

  const retryMissed = (missedQuestions) => {
    setQuestions(missedQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setCurrentAnswer(null);
    setScreen('quiz');
  };

  return (
    <div className="app">
      {screen === 'start' && <StartScreen onStart={startQuiz} />}
      
      {screen === 'quiz' && (
        <QuizScreen
          question={questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onSubmit={submitAnswer}
        />
      )}
      
      {screen === 'feedback' && (
        <FeedbackScreen
          question={questions[currentQuestionIndex]}
          userAnswer={currentAnswer}
          onNext={nextQuestion}
        />
      )}
      
      {screen === 'results' && (
        <ResultsScreen
          questions={questions}
          userAnswers={userAnswers}
          onRestart={restartQuiz}
          onRetryMissed={retryMissed}
        />
      )}
    </div>
  );
}

export default App;