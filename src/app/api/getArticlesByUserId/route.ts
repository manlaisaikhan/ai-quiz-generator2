import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "../../../lib/prisma";

export const GET = async () => {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user in database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
    } catch (dbError: unknown) {
      console.error("Database connection error:", dbError);
      const errorMessage = dbError instanceof Error 
        ? dbError.message 
        : "Database connection failed";
      
      // Check if it's a connection error
      if (errorMessage.includes("Tenant or user not found") || 
          errorMessage.includes("connection") ||
          errorMessage.includes("ECONNREFUSED")) {
        return Response.json(
          { 
            err: "Database connection failed. Please check your DATABASE_URL and ensure your database is accessible.",
            articles: [] 
          },
          { status: 500 }
        );
      }
      
      return Response.json(
        { 
          err: `Database error: ${errorMessage}`,
          articles: [] 
        },
        { status: 500 }
      );
    }

    if (!user) {
      // If user doesn't exist, create one automatically
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return Response.json({ articles: [] }, { status: 200 });
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
        return Response.json({ articles: [] }, { status: 200 });
      }
    }

    let articles;
    try {
      articles = await prisma.article.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return Response.json(
        { 
          err: "Failed to fetch articles from database.",
          articles: [] 
        },
        { status: 500 }
      );
    }

    return Response.json({ articles }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return Response.json(
      { err: "An unexpected error occurred", articles: [] },
      { status: 500 }
    );
  }
};
