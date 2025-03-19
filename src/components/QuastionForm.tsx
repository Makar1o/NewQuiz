import React, { useState } from "react";

interface Question {
  text: string;
  type: "text" | "single" | "multiple";
  options: string[];
}

interface QuestionFormProps {
  onAddQuestion: (question: Question) => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onAddQuestion }) => {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<Question["type"]>("text");
  const [options, setOptions] = useState<string[]>([]);
  const [optionText, setOptionText] = useState("");

  const handleAddOption = () => {
    if (optionText.trim()) {
      setOptions((prev) => [...prev, optionText]);
      setOptionText("");
    }
  };

  const handleSubmit = () => {
    if (!questionText.trim()) {
      alert("Please enter a question.");
      return;
    }

    onAddQuestion({ text: questionText, type: questionType, options });
    setQuestionText("");
    setOptions([]);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Question text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <select
        value={questionType}
        onChange={(e) => setQuestionType(e.target.value as Question["type"])}
      >
        <option value="text">Text</option>
        <option value="single">Single Choice</option>
        <option value="multiple">Multiple Choice</option>
      </select>
      {questionType !== "text" && (
        <div>
          <input
            type="text"
            placeholder="Answer option"
            value={optionText}
            onChange={(e) => setOptionText(e.target.value)}
          />
          <button onClick={handleAddOption}>Add Option</button>
          <ul>
            {options.map((option, index) => (
              <li key={index}>{option}</li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={handleSubmit}>Add Question</button>
    </div>
  );
};

export default QuestionForm;
