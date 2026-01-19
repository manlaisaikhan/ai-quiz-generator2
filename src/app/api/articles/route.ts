import { GoogleGenAI } from "@google/genai";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "../../../lib/prisma";

const geminiApi = new GoogleGenAI({
  apiKey: process.env.GEMINI_TOKEN,
});

export const POST = async (req: Request) => {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return Response.json({ err: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await req.json();
    
    if (!title || !content) {
      return Response.json({ err: "Title and content are required" }, { status: 400 });
    }

    // Find or create user in database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return Response.json(
        { err: "Database connection failed. Please check your DATABASE_URL configuration." },
        { status: 500 }
      );
    }

    if (!user) {
      // If user doesn't exist, create one automatically
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return Response.json(
          { err: "Unable to fetch user information" },
          { status: 401 }
        );
      }

      try {
        user = await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email: clerkUser.emailAddresses?.[0]?.emailAddress ?? "",
            name: clerkUser.firstName ?? clerkUser.username ?? "",
          },
        });
      } catch (createError) {
        console.error("Failed to create user:", createError);
        return Response.json(
          { err: "Failed to create user in database" },
          { status: 500 }
        );
      }
    }

    const prompt = `Please provide a concise summary of the following article: ${content}`;
    const res = await geminiApi.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });
    const summarizedContent =
      res?.candidates?.[0]?.content?.parts?.[0].text ?? "";
    
    const create = await prisma.article.create({
      data: {
        title: title,
        content: content,
        summary: summarizedContent,
        userId: user.id,
      },
    });
    return Response.json(create);
  } catch (err) {
    console.log(err, "server error");
    return Response.json({ err: "server error" }, { status: 500 });
  }
};
export const GET = async () => {
  try {
    const article = await prisma.article.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });
    return Response.json(article);
  } catch (err) {
    console.error(err);
    return Response.json({ err: "server error" }, { status: 500 });
  }
};
