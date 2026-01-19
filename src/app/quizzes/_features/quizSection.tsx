"use client";
import { SideBarOpened } from "@/app/_features/sideBarOpened";
import { SideBarIcon } from "@/app/_icons/sideBarIcon";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { QuickTestFromHistory } from "../_components/quickTestFromHistoy";
import { TestResult } from "@/app/_features/testResult";

interface Quiz {
  id: string;
  question: string;
  options: string[];
  answer: string;
  articleId: string;
  createdAt: string;
  updatedAt: string;
}

export const QuizSection = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [sideBarState, setSideBarState] = useState(false);
  const [quizData, setQuizData] = useState<Quiz[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const getQuizzes = useCallback(async () => {
    if (!id || id === "undefined") {
      setError("Article ID is missing");
      return;
    }

    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeOutId = setTimeout(() => {
      controller.abort();
    }, 5000);
    try {
      const response = await fetch(`/api/generate?articleId=${id}`, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }

      const data = await response.json();
      setQuizData(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.error("Fetch timeOut");
        setError("Request timed out");
      } else {
        console.error(err);
        setError("Failed to load quiz. Please try again.");
      }
    } finally {
      clearTimeout(timeOutId);
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    if (id && id !== "undefined") {
      getQuizzes();
    } else {
      setError("Invalid article ID");
    }
  }, [id, getQuizzes]);

  const nextTest = () => {
    setCurrentIndex(currentIndex + 1);
    if (currentIndex === 4) {
      setStep(4);
    }
  };

  return (
    <div className="flex w-full h-full">
      <div
        className={`h-full bg-white border-r border-zinc-200 transition-all duration-300 ease-in-out`}
        style={{
          width: sideBarState ? "300px" : "72px",
        }}
      >
        {sideBarState ? (
          <SideBarOpened sideBarClose={() => setSideBarState(false)} />
        ) : (
          <button
            className="cursor-pointer px-6 pt-6 w-fit h-fit opacity-100"
            onClick={() => setSideBarState(true)}
          >
            <SideBarIcon />
          </button>
        )}
      </div>
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
      {!error && step === 1 && (
        <QuickTestFromHistory
          onNext={nextTest}
          data={quizData[currentIndex]}
          current={currentIndex + 1}
          total={5}
          loading={loading}
        />
      )}
      {step === 4 && (
        <TestResult
          restartQuiz={() => setStep(1)}
          fetch={getQuizzes}
          backToHome={() => router.push("/")}
          currentIndex={() => setCurrentIndex(0)}
        />
      )}
    </div>
  );
};
