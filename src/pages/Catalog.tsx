import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns"; // імпортуємо функцію для форматування часу
import supabase from "../supabaseClient";

const Catalog = () => {
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortCriteria, setSortCriteria] = useState<string>("created_at"); // За замовчуванням сортуємо по даті створення
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Напрямок сортування

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        const { data, error } = await supabase.from("questionnaires").select(
          `
            *,
            questions:questions(questionnaire_id),
            questions_count:questions(id)
          `
        );

        if (error) throw error;

        // Для кожної анкети додаємо кількість питань
        const questionnairesWithQuestionCount = data.map(
          (questionnaire: any) => ({
            ...questionnaire,
            questionCount: questionnaire.questions_count.length,
          })
        );

        // Сортування на стороні клієнта
        const sortedQuestionnaires = questionnairesWithQuestionCount.sort(
          (a, b) => {
            if (sortCriteria === "questionCount") {
              return sortDirection === "asc"
                ? a.questionCount - b.questionCount
                : b.questionCount - a.questionCount;
            } else if (sortCriteria === "created_at") {
              return sortDirection === "asc"
                ? new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                : new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime();
            } else if (sortCriteria === "name") {
              return sortDirection === "asc"
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
            }
            return 0;
          }
        );

        setQuestionnaires(sortedQuestionnaires);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaires();
  }, [sortCriteria, sortDirection]);
  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from("questionnaires")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setQuestionnaires((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error("Error deleting questionnaire:", err);
    }
  };

  const handleSortChange = (criteria: string) => {
    if (criteria === sortCriteria) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortCriteria(criteria);
      setSortDirection("desc");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="header">
        <header className="header-container">
          <h1>Quiz Catalog</h1>
          <Link to="/builder">
            <button className="btn-main">Create Quiz</button>
          </Link>
        </header>
      </div>
      <h2 className="sort-by">Sort by:</h2>
      <div className="filter-btns">
        <button
          className="filter-btn"
          onClick={() => handleSortChange("created_at")}
        >
          Date Created
        </button>
        <button className="filter-btn" onClick={() => handleSortChange("name")}>
          Title Name
        </button>
        <button
          className="filter-btn"
          onClick={() => handleSortChange("questionCount")}
        >
          Question Count
        </button>
      </div>

      <div className="cards-container">
        <div className="quiz-cards">
          {questionnaires.map((q) => (
            <div key={q.id} className="quiz-card">
              <div className="card-stats">
                <p>
                  Created: {formatDistanceToNow(new Date(q.created_at))} ago
                </p>{" "}
                <p>Questions: {q.questionCount}</p>{" "}
              </div>
              <h3 className="title-card">{q.name}</h3>
              <p className="description-card">{q.description}</p>
              <hr className="divider-card" />
              <div className="btns-card">
                <Link className="btn-secondary" to={`/run/${q.id}`}>
                  Run
                </Link>
                <Link className="btn-secondary" to={`/edit/${q.id}`}>
                  Edit
                </Link>
                <button
                  className="btn-secondary"
                  onClick={() => handleDelete(q.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
