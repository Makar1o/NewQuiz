import { useState, useEffect } from "react";

const useSurveyState = (storageKey: string) => {
  const [answerss, setAnswers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
  }, [storageKey]);

  const updateAnswer = (questionId: string, answer: string) => {
    const updatedAnswers = { ...answerss, [questionId]: answer };
    setAnswers(updatedAnswers);
    localStorage.setItem(storageKey, JSON.stringify(updatedAnswers));
  };

  const clearAnswers = () => {
    localStorage.removeItem(storageKey);
    setAnswers({});
  };

  return { answerss, updateAnswer, clearAnswers };
};

export default useSurveyState;
