import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Quiz.css';

function Quiz() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [isPaused, setIsPaused] = useState(false);

  // Example quiz data (in a real app, this would come from an API)
  const questions = useMemo(() => [
    {
      question: "What is the main purpose of artificial intelligence in modern applications?",
      options: [
        "To replace human workers",
        "To automate repetitive tasks",
        "To create virtual worlds",
        "To increase computer speed"
      ],
      correctAnswer: 1
    },
    {
      question: "Which type of AI is focused on specific tasks?",
      options: [
        "General AI",
        "Super AI",
        "Narrow AI",
        "Broad AI"
      ],
      correctAnswer: 2
    },
    {
      question: "What is one of the key applications of AI mentioned in the notes?",
      options: [
        "Gaming",
        "Social Media",
        "Machine Learning",
        "Web Development"
      ],
      correctAnswer: 2
    }
  ], []);

  // Create audio elements for correct/incorrect sounds
  const correctSoundRef = useRef(new Audio('/sounds/correct.wav'));
  const incorrectSoundRef = useRef(new Audio('/sounds/incorrect.wav'));
  
  useEffect(() => {
    correctSoundRef.current.volume = 0.5;
    incorrectSoundRef.current.volume = 0.5;
  }, []);

  const playSound = useCallback((isCorrect) => {
    try {
      if (isCorrect) {
        correctSoundRef.current.currentTime = 0;
        correctSoundRef.current.play();
      } else {
        incorrectSoundRef.current.currentTime = 0;
        incorrectSoundRef.current.play();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [correctSoundRef, incorrectSoundRef]);

  const handleAnswerSelect = useCallback((answerIndex) => {
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    setAnswers([...answers, { question: currentQuestion, selected: answerIndex, correct: isCorrect }]);
    if (isCorrect) {
      setScore(score + 1);
      playSound(true);
    } else {
      playSound(false);
    }
  }, [questions, currentQuestion, answers, score, playSound]);

  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsPaused(false);
    } else {
      setShowResults(true);
    }
  }, [currentQuestion, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers.find(a => a.question === currentQuestion - 1)?.selected || null);
    }
  }, [currentQuestion, answers]);

  const handleRetry = useCallback(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswers([]);
    setShowResults(false);
  }, [setCurrentQuestion, setSelectedAnswer, setScore, setAnswers, setShowResults]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: 'My Quiz Results',
        text: `I scored ${score}/${questions.length} on the quiz!`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [score, questions.length]);

  const handleSave = useCallback(() => {
    // Here you would implement saving to database
    console.log('Saving quiz results:', { score, answers });
  }, [score, answers]);

  const handleDelete = useCallback(() => {
    // Here you would implement deletion from database
    console.log('Deleting quiz');
    navigate('/notes');
  }, [navigate]);

  const showConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    const confettiCount = 200;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.opacity = Math.random();
      document.body.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 6000);
    }
  };

  useEffect(() => {
    // Reset timer when moving to a new question
    if (!showResults) {
      setTimeLeft(30);
    }
  }, [currentQuestion, showResults]);

  useEffect(() => {
    // Timer countdown
    let timer;
    if (!showResults && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !showResults) {
      // Auto-submit when time runs out
      handleNext();
    }

    return () => clearInterval(timer);
  }, [timeLeft, showResults, isPaused, handleNext]);

  const handleKeyPress = useCallback((e) => {
    switch (e.key) {
      case '1':
      case '2':
      case '3':
      case '4':
        if (selectedAnswer === null) {
          handleAnswerSelect(parseInt(e.key) - 1);
        }
        break;
      case 'Enter':
        if (selectedAnswer !== null) {
          handleNext();
        }
        break;
      case 'Backspace':
        handlePrevious();
        break;
      case ' ':
        setIsPaused(prev => !prev);
        break;
      default:
        break;
    }
  }, [selectedAnswer, handleAnswerSelect, handleNext, handlePrevious]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (showResults && score === questions.length) {
      showConfetti();
    }
  }, [showResults, score, questions.length]);

  if (showResults) {
    return (
      <div className="quiz">
        <div className="container">
          <div className="quiz-header">
            <h2>Quiz Results</h2>
            <div className="quiz-controls">
              <Link to="/notes" className="btn btn-outline">← Back to Notes</Link>
            </div>
          </div>

          <div className="quiz-content card">
            <div className="results-section">
              <h3>
                Your Score: {score}/{questions.length}
                {score === questions.length && (
                  <span className="perfect-score">🎉 Perfect Score!</span>
                )}
              </h3>
              <div className="results-details">
                {questions.map((q, index) => (
                  <div key={index} className="result-item">
                    <p className="question-text">{q.question}</p>
                    <div className="answer-review">
                      <span className={answers[index]?.correct ? 'correct' : 'incorrect'}>
                        Your answer: {q.options[answers[index]?.selected]}
                        {answers[index]?.correct ? (
                          <svg viewBox="0 0 24 24" className="icon">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="icon">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        )}
                      </span>
                      {!answers[index]?.correct && (
                        <span className="correct">
                          Correct answer: {q.options[q.correctAnswer]}
                          <svg viewBox="0 0 24 24" className="icon">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="quiz-actions">
              <button onClick={handleRetry} className="btn">
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Retry Quiz
              </button>
              <button onClick={handleShare} className="btn">
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
                Share Results
              </button>
              <button onClick={handleSave} className="btn">
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                </svg>
                Save Results
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Delete Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="container">
        <div className="quiz-header">
          <h2>Quiz Mode</h2>
          <div className="quiz-controls">
            <Link to="/notes" className="btn btn-outline">← Back to Notes</Link>
            <select className="difficulty-select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button 
              className={`btn btn-icon ${isPaused ? 'paused' : ''}`}
              onClick={() => setIsPaused(prev => !prev)}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="quiz-content card">
          <div className="timer-bar">
            <div 
              className="timer-progress" 
              style={{ 
                width: `${(timeLeft / 30) * 100}%`,
                backgroundColor: timeLeft > 10 ? '#4CAF50' : timeLeft > 5 ? '#ff9800' : '#f44336'
              }}
            />
            <span className="timer-text">{timeLeft}s</span>
          </div>

          <div className="question-section">
            <h3>Question {currentQuestion + 1}/{questions.length}</h3>
            <p className="question-text">{questions[currentQuestion].question}</p>
            <div className="keyboard-hints">
              <span>Press 1-4 to select answer</span>
              <span>Space to pause</span>
              <span>Enter to continue</span>
              <span>Backspace to go back</span>
            </div>
          </div>

          <div className="answers-section">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                className={`answer-btn ${selectedAnswer === index ? 'selected' : ''} ${
                  selectedAnswer !== null ? (
                    index === questions[currentQuestion].correctAnswer ? 'correct' :
                    index === selectedAnswer ? 'incorrect' : ''
                  ) : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                <span className="answer-number">{index + 1}</span>
                {option}
                {selectedAnswer !== null && (
                  <div className="answer-icon">
                    {index === questions[currentQuestion].correctAnswer ? (
                      <svg viewBox="0 0 24 24" className="icon">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    ) : index === selectedAnswer ? (
                      <svg viewBox="0 0 24 24" className="icon">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    ) : null}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="quiz-navigation">
            <button 
              className="btn" 
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </button>
            <div className="quiz-progress">
              {questions.map((_, index) => (
                <div 
                  key={index} 
                  className={`progress-dot ${index === currentQuestion ? 'current' : ''} ${
                    answers.find(a => a.question === index)?.correct ? 'correct' : 
                    answers.find(a => a.question === index) ? 'incorrect' : ''
                  }`}
                />
              ))}
            </div>
            <button 
              className="btn"
              onClick={handleNext}
              disabled={selectedAnswer === null}
            >
              {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
