import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { Link } from "react-router-dom";

interface Question {
  id: number;
  text: string;
  type: "text" | "single" | "multiple";
  options: string[];
}

const Run = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string | string[] }>(
    {}
  );
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("questionnaire_id", id);

        if (questionsError) throw new Error(questionsError.message);

        const questionIds = questionsData.map((q) => q.id);
        const { data: optionsData, error: optionsError } = await supabase
          .from("options")
          .select("*")
          .in("question_id", questionIds);

        if (optionsError) throw new Error(optionsError.message);

        const questionsWithOptions = questionsData.map((q) => ({
          ...q,
          options: optionsData
            .filter((opt) => opt.question_id === q.id)
            .map((o) => o.text),
        }));

        setQuestions(questionsWithOptions);
      } catch (err: any) {
        console.error("Error fetching questions:", err.message);
      }
    };

    fetchQuestions();
  }, [id]);

  useEffect(() => {
    // Завантаження відповідей з localStorage при ініціалізації компонента
    const storedAnswers = localStorage.getItem(`answers-${id}`);
    if (storedAnswers) {
      setAnswers(JSON.parse(storedAnswers));
    }
  }, [id]);

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setAnswers((prev) => {
      const updatedAnswers = { ...prev, [questionId]: value };
      localStorage.setItem(`answers-${id}`, JSON.stringify(updatedAnswers)); // Зберігаємо в localStorage
      return updatedAnswers;
    });
  };

  const handleSubmit = async () => {
    const completionTime = Math.floor((Date.now() - startTime) / 1000);

    const responseEntries = Object.entries(answers).map(
      ([questionId, answer]) => ({
        questionnaire_id: id,
        question_id: parseInt(questionId),
        answer: Array.isArray(answer) ? answer.join(", ") : answer,
        completion_time: completionTime,
      })
    );

    try {
      await supabase.from("responses").insert(responseEntries);
      alert(`Test completed in ${completionTime} seconds!`);
      localStorage.removeItem(`answers-${id}`); // Очищаємо localStorage після відправки
      navigate(`/catalog`);
    } catch (error) {
      console.error("Error saving responses:", error);
    }
  };

  return (
    <section>
      <div className="header">
        <header className="header-container">
          <h1>Quiz Creator</h1>
          <Link to="/stats">
            <button className="btn-main">Quiz Stats</button>
          </Link>
        </header>
      </div>
      <div className="section-container run-container">
        {questions.map((q) => (
          <div key={q.id}>
            <p className="question-text">{q.text}</p>

            {q.type === "text" && (
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="input-field"
              />
            )}

            {q.type === "single" && (
              <div className="option-container option-container-culomn">
                {q.options.map((option) => (
                  <div
                    className="radio-btn"
                    style={{ display: "flex", alignItems: "center" }}
                    key={option}
                  >
                    <label style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={() => handleAnswerChange(q.id, option)}
                        className="radio-input"
                        style={{ marginRight: "8px" }}
                      />
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {q.type === "multiple" && (
              <div className="option-container option-container-culomn">
                {q.options.map((option) => (
                  <label
                    key={option}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <input
                      type="checkbox"
                      value={option}
                      checked={
                        Array.isArray(answers[q.id]) &&
                        (answers[q.id] as string[]).includes(option)
                      }
                      onChange={(e) => {
                        const updatedAnswers = Array.isArray(answers[q.id])
                          ? [...(answers[q.id] as string[])]
                          : [];
                        const newAnswers = e.target.checked
                          ? [...updatedAnswers, option]
                          : updatedAnswers.filter((a) => a !== option);
                        handleAnswerChange(q.id, newAnswers);
                      }}
                      className="checkbox-input"
                      style={{ marginRight: "8px" }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <button onClick={handleSubmit} className="btn-builder">
          Submit
        </button>
      </div>
    </section>
  );
};

export default Run;
