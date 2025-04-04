export interface SearchResult {
    id: string
    title: string
    excerpt: string
    type: "post" | "document" | "ticket" | "invoice" | "user"
    url: string
  }
  
  