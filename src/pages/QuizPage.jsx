import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import StartScreen from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import FeedbackScreen from '../components/FeedbackScreen';
import ResultsScreen from '../components/ResultsScreen';
import '../App.css';

function QuizPage() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentAttemptId, setCurrentAttemptId] = useState(attemptId || null);
  
  const [screen, setScreen] = useState('start');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [currentLessonIds, setCurrentLessonIds] = useState([]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load existing draft/attempt if resuming
  useEffect(() => {
    if (attemptId) {
      loadAttempt(attemptId);
    }
  }, [attemptId]);

  const loadAttempt = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setQuestions(data.questions);
        setUserAnswers(data.answers || []);
        setCurrentQuestionIndex(data.current_question_index || 0);
        setCurrentAttemptId(id);
        setCurrentLessonIds(data.selected_lessons || []);
        setScreen('quiz');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quizQuestions, lessonIds = []) => {
    try {
      setLoading(true);

      // Save lesson IDs to state for potential retries
      setCurrentLessonIds(lessonIds || []);

      // Create new attempt in database
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([{
          user_id: user.id,
          questions: quizQuestions,
          selected_lessons: lessonIds,
          answers: [],
          status: 'in_progress',
          current_question_index: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentAttemptId(data.id);
      setQuestions(quizQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setCurrentAnswer(null);
      setScreen('quiz');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (answer) => {
    setCurrentAnswer(answer);
    setScreen('feedback');
  };

  const nextQuestion = async () => {
    const newAnswers = [...userAnswers, currentAnswer];
    setUserAnswers(newAnswers);

    try {
      // Update answers in database
      await supabase
        .from('quiz_attempts')
        .update({ 
          answers: newAnswers,
          current_question_index: currentQuestionIndex + 1
        })
        .eq('id', currentAttemptId);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer(null);
        setScreen('quiz');
      } else {
        // Quiz completed - calculate score and update
        const correctCount = newAnswers.filter(
          (answer, index) => answer === questions[index].correctAnswer
        ).length;

  
        const isPerfectScore = correctCount === questions.length;
        
        // We only unlock if they took a SINGLE lesson (not a mixed bag)
        if (isPerfectScore && currentLessonIds.length === 1) {
          const lessonId = currentLessonIds[0];
          
          // Fetch current mastery list
          const { data: profile } = await supabase
            .from('profiles')
            .select('mastered_lessons')
            .eq('id', user.id)
            .single();

          const currentMastery = profile?.mastered_lessons || [];

          // If not already mastered, add it
          if (!currentMastery.includes(lessonId)) {
            await supabase
              .from('profiles')
              .update({
                mastered_lessons: [...currentMastery, lessonId]
              })
              .eq('id', user.id);
          }
        }


        await supabase
          .from('quiz_attempts')
          .update({ 
            answers: newAnswers,
            status: 'completed',
            score: correctCount
          })
          .eq('id', currentAttemptId);

        setScreen('results');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const saveDraft = async () => {
    try {
      setLoading(true);
      
      await supabase
        .from('quiz_attempts')
        .update({ 
          answers: userAnswers,
          status: 'draft',
          current_question_index: currentQuestionIndex
        })
        .eq('id', currentAttemptId);

      // Navigate silently - dashboard will show the saved draft
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restartQuiz = () => {
    navigate('/');
  };

  const retryMissed = async (missedQuestions) => {
    try {
      setLoading(true);

      // Create new attempt with parent_id linking to current attempt
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([{
          user_id: user.id,
          parent_id: currentAttemptId,
          questions: missedQuestions,
          selected_lessons: currentLessonIds,
          answers: [],
          status: 'in_progress',
          current_question_index: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentAttemptId(data.id);
      setQuestions(missedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setCurrentAnswer(null);
      setScreen('quiz');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}

      {screen === 'start' && <StartScreen onStart={startQuiz} />}
      
      {screen === 'quiz' && (
        <div>
          <QuizScreen
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onSubmit={submitAnswer}
          />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              className="button button-secondary"
              onClick={saveDraft}
              disabled={loading}
            >
              Save Draft & Exit
            </button>
          </div>
        </div>
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

export default QuizPage;

