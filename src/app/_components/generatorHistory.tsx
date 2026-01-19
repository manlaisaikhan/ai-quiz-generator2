"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Article = {
  id: string;
  title: string;
  createdAt: string; // ✅ DateTime → string
};

export const GeneratorHistoy = () => {
  const router = useRouter();
  const [articleData, setArticleData] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`/api/getArticlesByUserId`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.err || errorData.error || "Failed to fetch articles";
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // ✅ defensive
      setArticleData(Array.isArray(data.articles) ? data.articles : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          console.error("Fetch timeout");
          setError("Request timed out. Please try again.");
        } else {
          console.error(err);
          setError(err.message || "Failed to load articles");
        }
      } else {
        console.error(err);
        setError("An unexpected error occurred");
      }
      setArticleData([]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLabel = (createdAt: string) => {
    const now = Date.now();
    const diffMs = now - new Date(createdAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }

    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  };

  const groupedArticles = articleData.reduce<Record<string, Article[]>>(
    (acc, article) => {
      const label = getLabel(article.createdAt);
      if (!acc[label]) acc[label] = [];
      acc[label].push(article);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-5">
      {loading ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-[21px] w-[100px]" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-[200px] pl-2" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col gap-2 p-4">
          <p className="text-red-600 text-[14px]">{error}</p>
          <button
            onClick={fetchData}
            className="w-fit text-[14px] text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : Object.keys(groupedArticles).length === 0 ? (
        <div className="flex flex-col gap-2 p-4">
          <p className="text-zinc-400 text-[14px]">No articles yet. Create your first article to get started!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedArticles).map(([label, articles]) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-[14px] text-zinc-400">{label}</p>

              {articles.map((data) => (
                <button
                  key={data.id}
                  className="w-fit font-medium text-[16px] text-black text-start pl-2 btn-underline"
                  onClick={() => router.push(`/history/${data.id}`)}
                >
                  {data.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
