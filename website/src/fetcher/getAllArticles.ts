import sql from "../database";

interface Article {
  id: number;
  title: string;
  url: string;
  score: number;
  comments: number;
  time: number; // unix timestamp
  path: string;
}

interface ArticleDB {
  id: number;
  title: string;
  url: string;
  score: number;
  comments: number;
  time: number; // unix timestamp
  path: number[];
}

export async function getAllArticles(): Promise<Article[]> {
  const articles = await sql<ArticleDB[]>`
    SELECT
        hn_article.id,
        hn_post.title,
        descendants AS comments,
        score,
        path,
        url,
        time
    FROM
        hn_article
        INNER JOIN hn_post ON hn_post.id = hn_article.id
        INNER JOIN hn_embeddings ON hn_embeddings.id = hn_article.id`;
  return articles.map((article) => ({
    ...article,
    path: "/" + article.path.join("/"), // convert {a,b,c} to a/b/c
  }));
}

export type { Article };
