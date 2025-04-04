"use server"

import { db } from "@/lib/db"
import type { SearchResult } from "@/types/search"

export async function search({ query }: { query: string }): Promise<SearchResult[]> {
  if (!query || query.length < 2) {
    return []
  }

  try {
    // Perform search across different entities
    const results: SearchResult[] = []

    // Search in posts
    const posts = await db.query(
      `
      SELECT id, title, content, 'post' as type
      FROM community_posts
      WHERE title ILIKE $1 OR content ILIKE $1
      LIMIT 5
    `,
      [`%${query}%`],
    )

    results.push(
      ...posts.rows.map((post: { id: any; title: any; content: string }) => ({
        id: post.id,
        title: post.title,
        excerpt: post.content.substring(0, 100) + "...",
        type: "post",
        url: `/dashboard/community/${post.id}`,
      })),
    )

    // Search in documents
    const documents = await db.query(
      `
      SELECT id, name, description, 'document' as type
      FROM documents
      WHERE name ILIKE $1 OR description ILIKE $1
      LIMIT 5
    `,
      [`%${query}%`],
    )

    results.push(
      ...documents.rows.map((doc: { id: any; name: any; description: string }) => ({
        id: doc.id,
        title: doc.name,
        excerpt: doc.description?.substring(0, 100) + "..." || "No description",
        type: "document",
        url: `/dashboard/documents/business?id=${doc.id}`,
      })),
    )

    // Add more search sources as needed

    return results
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

export { search as default }

