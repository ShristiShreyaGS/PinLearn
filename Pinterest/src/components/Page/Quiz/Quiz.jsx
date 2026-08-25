import { useEffect, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { fetchQuizQuestions, fetchQuizzes, completeQuiz } from "../../../api/quiz";
import { getProfile } from "../../../api/user";
import PageBackdrop from "../PageBackdrop";

const INTEREST_ALIASES = {
  dsa: ["dsa", "data structures", "algorithms"],
  ai: ["ai", "artificial intelligence", "machine learning"],
  devops: ["devops", "docker", "kubernetes"]
};

function quizMatchesInterest(quiz, interest, search) {
  const searchableText = [
    quiz.title,
    quiz.description,
    quiz.category,
    quiz.difficulty
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const normalizedInterest = interest.toLowerCase();
  const interestTerms = INTEREST_ALIASES[normalizedInterest] || [normalizedInterest];
  const matchesInterest = interestTerms.some((term) => searchableText.includes(term));
  const matchesSearch = !search.trim() || searchableText.includes(search.trim().toLowerCase());

  return matchesInterest && matchesSearch;
}

function Quiz() {
  const [quizGroups, setQuizGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [quizLimit, setQuizLimit] = useState(10);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const routeTopic = (location.state && location.state.topic) || searchParams.get("topic") || "";
  const routeQuizId = (location.state && location.state.quizId) || searchParams.get("quizId") || "";
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    // If a topic is provided via route state or query param, load quizzes for that topic only.
    if (routeTopic) {
      (async () => {
        try {
          const list = await fetchQuizzes(quizLimit, routeTopic, search);
          if (!isMounted) return;
          setQuizGroups([{ interest: routeTopic, quizzes: list }]);
        } catch (err) {
          if (isMounted) setError(err.message || "Unable to load quizzes.");
        } finally {
          if (isMounted) setLoading(false);
        }
      })();
      return () => { isMounted = false; };
    }

    getProfile()
      .then((profile) => {
        const interests = Array.isArray(profile.selectedInterests) ? profile.selectedInterests : [];
        if (!interests.length) return [];
        return Promise.all(interests.map(async (interest) => ({
          interest,
          quizzes: await fetchQuizzes(quizLimit, interest, search)
        })));
      })
      .then((groups) => {
        if (!isMounted) return;
        setQuizGroups((groups || []).map((group) => ({
          ...group,
          quizzes: group.quizzes.filter((quiz) => quizMatchesInterest(quiz, group.interest, search))
        })));
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || "Unable to load quizzes.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, quizLimit, routeTopic]);

  const updateSearch = (value) => {
    setSearch(value);
    setQuizLimit(10);
  };

  // Auto-start a specific quiz if `quizId` was provided via route state or query param
  useEffect(() => {
    if (!routeQuizId) return;
    // try to find the quiz object from loaded groups
    const found = quizGroups.flatMap((g) => g.quizzes).find((q) => String(q.id) === String(routeQuizId));
    const quizToStart = found || { id: routeQuizId, title: routeTopic || "Topic quiz", interest: routeTopic };
    startQuiz(quizToStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeQuizId]);

  const startQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    setStarting(true);
    setError("");
    setResult(null);
    try {
      const nextQuestions = await fetchQuizQuestions(quiz.id);
      setQuestions(nextQuestions);
      setAnswers({});
      setQuestionIndex(0);
    } catch (requestError) {
      setError(requestError.message || "Unable to load quiz questions.");
      setSelectedQuiz(null);
    } finally {
      setStarting(false);
    }
  };

  const currentQuestion = questions[questionIndex];
  const selectedAnswer = answers[currentQuestion?.id];
  const isLastQuestion = questionIndex === questions.length - 1;

  const chooseAnswer = (answerKey) => {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: answerKey }));
  };

  const submitQuiz = async () => {
    if (!selectedQuiz || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const completion = await completeQuiz(selectedQuiz.id, {
        title: selectedQuiz.title,
        topic: selectedQuiz.interest || selectedQuiz.category,
        answers
      });
      setResult(completion);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <QuizShell><p className="text-slate-500 dark:text-slate-400">Loading quizzes...</p></QuizShell>;
  }

  if (result) {
    return (
      <QuizShell>
        <div className="max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Quiz complete</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">Nice work.</h1>
          <p className="mt-3 text-slate-700 dark:text-slate-300">Score: {result.score} / {result.totalQuestions}</p>
          <p className="mt-2 text-slate-700 dark:text-slate-300">Current streak: {result.streak?.current || 0} day{result.streak?.current === 1 ? "" : "s"}</p>
          {result.completed === false && <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">You have already completed a quiz today. Your streak was not counted twice.</p>}
          <button className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900" type="button" onClick={() => { setResult(null); setSelectedQuiz(null); setQuestions([]); }}>Choose another quiz</button>
        </div>
      </QuizShell>
    );
  }

  if (selectedQuiz && currentQuestion) {
    return (
      <QuizShell>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Daily quiz</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{selectedQuiz.title}</h1>
          </div>
          <span className="text-sm font-semibold text-slate-500">{questionIndex + 1} / {questions.length}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-semibold leading-8 text-slate-950 dark:text-white">{currentQuestion.question}</h2>
          {currentQuestion.description && <p className="mt-2 text-sm text-slate-500">{currentQuestion.description}</p>}
          <div className="mt-6 grid gap-3">
            {Array.isArray(currentQuestion.answers) && currentQuestion.answers.length > 0 ? (
              currentQuestion.answers.map((answer) => (
                <button
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selectedAnswer === answer.key ? "border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-100" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
                  key={answer.key}
                  type="button"
                  onClick={() => chooseAnswer(answer.key)}
                >
                  {answer.text}
                </button>
              ))
            ) : (
              <div>
                <label className="sr-only">Your answer</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  rows={4}
                  value={selectedAnswer || ""}
                  placeholder="Type your answer here..."
                  onChange={(e) => chooseAnswer(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end">
          {isLastQuestion ? (
            <button className="rounded-full bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={!selectedAnswer || submitting} onClick={submitQuiz}>{submitting ? "Submitting..." : "Complete quiz"}</button>
          ) : (
            <button className="rounded-full bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={!selectedAnswer} onClick={() => setQuestionIndex((index) => index + 1)}>Next question</button>
          )}
        </div>
      </QuizShell>
    );
  }

  // If no specific topic is selected via route, show topic cards (one per interest)
  if (!routeTopic) {
    return (
      <QuizShell>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Daily quiz</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Choose a topic</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">Select a topic to see all available quizzes for it.</p>
        <div className="mt-7 max-w-2xl">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400" htmlFor="quiz-search">Find a quiz topic</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            id="quiz-search"
            type="search"
            value={search}
            placeholder="Search topics, e.g. hooks or containers"
            onChange={(event) => updateSearch(event.target.value)}
          />
        </div>
        {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizGroups.map((group) => (
            <article key={group.interest} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">{group.interest}</p>
              <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{group.interest}</h3>
              <p className="mt-2 text-sm text-slate-500">{group.quizzes.length} quiz{group.quizzes.length === 1 ? "" : "zes"}</p>
              <div className="mt-4 flex gap-3">
                <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900" type="button" onClick={() => navigate(`/quiz`, { state: { topic: group.interest } })}>View quizzes</button>
                <button className="rounded-full border px-4 py-2 text-sm font-bold" type="button" onClick={() => navigate(`/quiz`, { state: { topic: group.interest } })}>Explore</button>
              </div>
            </article>
          ))}
        </div>
      </QuizShell>
    );
  }

  // If a topic is selected, show quizzes for that topic with load more
  return (
    <QuizShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Topic quizzes</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Quizzes: {routeTopic}</h1>
        </div>
      </div>
      {quizGroups.map((group) => (
        <section key={group.interest}>
          {group.quizzes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {group.quizzes.map((quiz) => (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900" key={`${group.interest}-${quiz.id}`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">{quiz.category} · {quiz.difficulty}</p>
                  <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{quiz.title}</h3>
                  {quiz.description && <p className="mt-2 line-clamp-3 text-sm text-slate-500">{quiz.description}</p>}
                  <div className="mt-4 flex gap-3">
                    <button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-900" type="button" disabled={starting} onClick={() => startQuiz({ ...quiz, interest: group.interest })}>{starting ? "Loading..." : `Start`}</button>
                    <button className="rounded-full border px-4 py-2 text-sm font-bold" type="button" onClick={() => navigate(`/topics/${encodeURIComponent(group.interest)}/videos`)}>Open topic</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No quizzes found for this topic yet.</p>
          )}
        </section>
      ))}

      <div className="mt-8 flex justify-center">
        <button
          className="mx-auto mt-2 block rounded-full bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={loading || quizLimit >= 50}
          onClick={() => setQuizLimit((limit) => Math.min(limit + 10, 50))}
        >
          {loading ? "Loading..." : quizLimit >= 50 ? "No more quizzes" : "Load more quizzes"}
        </button>
      </div>
    </QuizShell>
  );
}

function QuizShell({ children }) {
  return (
    <div className="relative isolate min-h-screen text-slate-800 dark:text-slate-200">
      <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

export default Quiz;
