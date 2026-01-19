"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Title } from "../_components/title";
import { ArticleIcon } from "../_icons/articleIcon";
import { Spinner } from "@/components/ui/spinner";

export const ArticleGenerator = () => {
  const router = useRouter();
  const { user } = useUser();
  const [articleTitle, setArticleTitle] = useState("");
  const [artcileContent, setArticleContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const returnArticle = async () => {
    if (!articleTitle) {
      setError("Please enter an article title");
      return;
    }
    if (!artcileContent) {
      setError("Please enter article content");
      return;
    }
    if (!user) {
      setError("Please sign in to create articles");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleTitle,
          content: artcileContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.err || "Failed to create article");
      }

      await response.json();
      // Redirect to summary page - it will fetch the latest article
      router.push(`/summary`);
    } catch (err) {
      console.error(err, "error from client");
      setError(err instanceof Error ? err.message : "Failed to create article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-zinc-100 flex justify-center pt-12">
      <div className="w-[856px] h-[458px] border border-zinc-200 bg-white rounded-lg p-7 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Title title="Article Quiz Generator" />
          <p className="text-zinc-400 text-[16px] font-normal">
            Paste your article below to generate a summarize and quiz question.
            Your articles will saved in the
            <br /> sidebar for future reference.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="flex items-center text-zinc-400 text-[14px] font-semibold gap-1">
            <ArticleIcon />
            Article title
          </p>
          <textarea
            className="outline-none border border-zinc-200 w-[800px] min-h-10 max-h-10 rounded-lg text-[14px] font-normal text-black flex justify-start px-3 py-2"
            placeholder="Enter a title for your article..."
            onChange={(e) => setArticleTitle(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="flex items-center text-zinc-400 text-[14px] font-semibold gap-1">
            <ArticleIcon />
            Article content
          </p>
          <textarea
            className="outline-none border border-zinc-200 w-[800px] min-h-[120px] max-h-[385px] rounded-lg text-[14px] font-normal text-black flex justify-start px-3 py-2 resize-none"
            placeholder="Paste your article content here..."
            onChange={(e) => setArticleContent(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && (
          <div className="w-[800px] p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-[14px]">{error}</p>
          </div>
        )}
        <div className="w-[800px] flex items-center justify-end">
          <button
            className={`w-40 h-10 rounded-lg flex items-center justify-center text-[14px] text-white font-medium ${
              artcileContent.length > 0 && articleTitle.length > 0
                ? "bg-black btn-shadcn"
                : "bg-zinc-200"
            } ${
              loading === true
                ? "bg-zinc-400 gap-2"
                : "cursor-pointer btn-shadcn"
            }`}
            onClick={returnArticle}
            disabled={loading}
          >
            {loading === true ? (
              <>
                <Spinner /> Generating...
              </>
            ) : (
              "Generate summary"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
