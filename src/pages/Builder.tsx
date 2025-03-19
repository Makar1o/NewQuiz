import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { Link } from "react-router-dom";

interface Question {
  id?: number;
  text: string;
  type: "text" | "single" | "multiple";
  options: string[];
}

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  // Завантажуємо дані з localStorage при завантаженні компонента
  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const storedDescription = localStorage.getItem("description");
    const storedQuestions = localStorage.getItem("questions");

    if (storedName) setName(storedName);
    if (storedDescription) setDescription(storedDescription);
    if (storedQuestions) setQuestions(JSON.parse(storedQuestions));

    if (!id) return;

    const fetchData = async () => {
      const { data: questionnaire, error: qError } = await supabase
        .from("questionnaires")
        .select("*")
        .eq("id", id)
        .single();

      if (qError) return console.error(qError);

      setName(questionnaire.name);
      setDescription(questionnaire.description);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("questionnaire_id", id);

      if (questionsError) return console.error(questionsError);

      const { data: optionsData, error: optionsError } = await supabase
        .from("options")
        .select("*")
        .in(
          "question_id",
          questionsData.map((q) => q.id)
        );

      if (optionsError) return console.error(optionsError);

      const questionsWithOptions = questionsData.map((q) => ({
        ...q,
        options: optionsData
          .filter((opt) => opt.question_id === q.id)
          .map((o) => o.text),
      }));

      setQuestions(questionsWithOptions);
    };

    fetchData();
  }, [id]);

  const handleAddQuestion = (type: Question["type"]) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [
        ...prevQuestions,
        { text: "", type, options: type !== "text" ? [""] : [] },
      ];
      // Оновлюємо localStorage
      localStorage.setItem("questions", JSON.stringify(updatedQuestions));
      return updatedQuestions;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = prevQuestions.filter((_, i) => i !== index);
      // Оновлюємо localStorage
      localStorage.setItem("questions", JSON.stringify(updatedQuestions));
      return updatedQuestions;
    });
  };

  const handleSave = async () => {
    if (
      !name ||
      !description ||
      questions.length === 0 ||
      questions.some((q) => !q.text)
    ) {
      return alert(
        "Please fill in all fields and add at least one valid question."
      );
    }

    let questionnaireId = id;
    if (!id) {
      const { data, error } = await supabase
        .from("questionnaires")
        .insert([{ name, description }])
        .select("id")
        .single();

      if (error) return console.error(error);
      questionnaireId = data.id;
    }

    for (const question of questions) {
      if (!question.text) continue;

      let questionId = question.id;
      if (!questionId) {
        const { data, error } = await supabase
          .from("questions")
          .insert([
            {
              questionnaire_id: questionnaireId,
              text: question.text,
              type: question.type,
            },
          ])
          .select("id")
          .single();

        if (error) return console.error(error);
        questionId = data.id;
      }

      if (question.type !== "text") {
        await supabase.from("options").delete().eq("question_id", questionId);
        await supabase.from("options").insert(
          question.options.map((option) => ({
            question_id: questionId,
            text: option,
          }))
        );
      }
    }

    // Очищаємо localStorage після збереження
    localStorage.removeItem("name");
    localStorage.removeItem("description");
    localStorage.removeItem("questions");

    navigate(`/catalog`);
  };

  // Оновлюємо localStorage при зміні name, description або questions
  useEffect(() => {
    localStorage.setItem("name", name);
    localStorage.setItem("description", description);
    localStorage.setItem("questions", JSON.stringify(questions));
  }, [name, description, questions]);

  return (
    <div className="builder-container">
      <div className="header">
        <header className="header-container">
          <h1>Quiz Creator</h1>
          <Link to="/stats">
            <button className="btn-main">Quiz Stats</button>
          </Link>
        </header>
      </div>
      <section className="section-container">
        <input
          className="title-input"
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="describe-input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {questions.map((q, index) => (
          <div key={index} className="question-container">
            <div className="question-header">
              <input
                type="text"
                className="question-input"
                placeholder="Question"
                value={q.text}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[index].text = e.target.value;
                  setQuestions(updated);
                }}
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
                      className="option-input"
                      value={option}
                      placeholder="Option"
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[index].options[optIdx] = e.target.value;
                        setQuestions(updated);
                      }}
                    />
                  </div>
                ))}

                <button
                  className="btn-builder btn-add-option"
                  onClick={() => {
                    const updated = [...questions];
                    updated[index].options.push("");
                    setQuestions(updated);
                  }}
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
            Save
          </button>
        </div>
      </section>
    </div>
  );
};

export default Builder;
