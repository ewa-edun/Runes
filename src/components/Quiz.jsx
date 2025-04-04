import './Quiz.css'

function Quiz() {
  return (
    <div className="quiz">
      <div className="container">
        <div className="quiz-header">
          <h2>Quiz Mode</h2>
          <div className="quiz-controls">
            <select className="difficulty-select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="quiz-content card">
          <div className="question-section">
            <h3>Question 1/5</h3>
            <p className="question-text">What is the main purpose of artificial intelligence in modern applications?</p>
          </div>

          <div className="answers-section">
            <button className="answer-btn">
              To replace human workers
            </button>
            <button className="answer-btn">
              To automate repetitive tasks
            </button>
            <button className="answer-btn">
              To create virtual worlds
            </button>
            <button className="answer-btn">
              To increase computer speed
            </button>
          </div>

          <div className="quiz-navigation">
            <button className="btn">Previous</button>
            <button className="btn">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quiz
