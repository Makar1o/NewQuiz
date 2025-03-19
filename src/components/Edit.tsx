import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { Link } from "react-router-dom";
import useSurveyState from "./useSurveyState";

interface Question {
  id?: number;
  text: string;
  type: "text" | "single" | "multiple";
  options: string[];
}

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const { answerss, updateAnswer, clearAnswers } = useSurveyState(
    `survey_${id}`
  );

  useEffect(() => {
    const storedQuestions = localStorage.getItem("questions");
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    }

    if (!id) return;

    const fetchData = async () => {
      try {
        const { data: questionnaire, error: qError } = await supabase
          .from("questionnaires")
          .select("*")
          .eq("id", id)
          .single();

        if (qError) throw qError;
        setName(questionnaire.name);
        setDescription(questionnaire.description);

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .eq("questionnaire_id", id);

        if (questionsError) throw questionsError;

        if (!questionsData || questionsData.length === 0) {
          setQuestions([]);
          return;
        }

        const questionsWithOptions = await Promise.all(
          questionsData.map(async (q) => {
            const { data: optionsData, error: optionsError } = await supabase
              .from("options")
              .select("*")
              .eq("question_id", q.id);
            if (optionsError) throw optionsError;

            return {
              ...q,
              options: optionsData.map((opt) => opt.text),
            };
          })
        );

        setQuestions(questionsWithOptions);
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
      }
    };

    fetchData();
  }, [id]);

  const updateLocalStorage = (updatedQuestions: Question[]) => {
    localStorage.setItem("questions", JSON.stringify(updatedQuestions));
  };

  const handleAddQuestion = (type: Question["type"]) => {
    const newQuestion = { text: "", type, options: [] };
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    updateLocalStorage(updatedQuestions);
  };

  const handleQuestionChange = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
    updateLocalStorage(updated);
  };

  const handleAddOption = (index: number) => {
    const updated = [...questions];
    updated[index].options.push("");
    setQuestions(updated);
    updateLocalStorage(updated);
  };

  const handleOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string
  ) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
    updateLocalStorage(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    updateLocalStorage(updated);
  };

  const handleSave = async () => {
    if (!name || !description) return alert("Please fill in all fields.");

    try {
      await supabase
        .from("questionnaires")
        .update({ name, description })
        .eq("id", id);

      for (const question of questions) {
        if (question.id) {
          await supabase
            .from("questions")
            .update({ text: question.text, type: question.type })
            .eq("id", question.id);

          await supabase
            .from("options")
            .delete()
            .eq("question_id", question.id);
        } else {
          const { data, error } = await supabase
            .from("questions")
            .insert([
              {
                questionnaire_id: id,
                text: question.text,
                type: question.type,
              },
            ])
            .select("id")
            .single();
          if (error) throw error;
          question.id = data.id;
        }

        if (question.type !== "text" && question.options.length) {
          await supabase.from("options").insert(
            question.options.map((option) => ({
              question_id: question.id,
              text: option,
            }))
          );
        }
      }

      localStorage.removeItem("questions");
      clearAnswers();

      alert("Questionnaire updated successfully!");
      navigate("/catalog");
    } catch (error) {
      console.error("Error updating questionnaire:", error);
    }
  };

  return (
    <div className="builder-container">
      <div className="header">
        <header className="header-container">
          <h1>Quiz Edit</h1>
          <Link to="/stats">
            <button className="btn-main">Stats</button>
          </Link>
        </header>
      </div>

      <section className="section-container">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="title-input"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="describe-input"
        />

        <h2>Questions:</h2>
        {questions.map((q, index) => (
          <div key={q.id || index} className="question-container">
            <div className="question-header">
              <input
                type="text"
                value={q.text}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                className="question-input"
                placeholder="Question"
              />
              <button
                className="btn-builder"
                onClick={() => handleDeleteQuestion(index)}
              >
                Remove
              </button>
            </div>

            {q.type !== "text" && (
              <div className="option-container">
                {q.options.map((option, optIdx) => (
                  <div key={optIdx} className="option-wrapper">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, optIdx, e.target.value)
                      }
                      className="option-input"
                    />
                  </div>
                ))}
                <button
                  className="btn-builder btn-add-option"
                  onClick={() => handleAddOption(index)}
                >
                  Add Option
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="builder-btns sticky-footer">
          <button
            className="btn-builder"
            onClick={() => handleAddQuestion("text")}
          >
            Add Text Question
          </button>
          <button
            className="btn-builder"
            onClick={() => handleAddQuestion("single")}
          >
            Add Single Choice
          </button>
          <button
            className="btn-builder"
            onClick={() => handleAddQuestion("multiple")}
          >
            Add Multiple Choice
          </button>
          <button className="btn-builder" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </section>
    </div>
  );
};

export default Edit;
