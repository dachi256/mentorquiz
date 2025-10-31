# Vocab Quiz App

React vocabulary quiz for SAT prep

## Setup

```bash
npm install
npm run dev
```

## Features

- Select lessons to practice
- Multiple choice questions
- Immediate feedback
- Track missed words
- Retry incorrect answers

## Structure

```
src/
  components/
    StartScreen.jsx    - Lesson selection
    QuizScreen.jsx     - Question display
    FeedbackScreen.jsx - Answer feedback
    ResultsScreen.jsx  - Score summary
  quiz-data.json       - words
  App.jsx             - Main app logic
```

## Add/Edit Words

Edit `src/quiz-data.json`:

```json
{
  "id": 36,
  "word": "example",
  "definition": "sample or instance",
  "sentence": "This is an _____ sentence.",
  "correctAnswer": "example",
  "options": ["example", "option1", "option2", "option3"]
}
```

## Tech

- React 18
- Vite
- CSS (no frameworks)