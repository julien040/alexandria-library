import { toSql } from "pgvector";
import sql from "../database";
import getEmbeddings from "./openai";
import type { Link, Article } from "./getStaticPathHelper";

type ArticleDB = {
  id: number;
  title: string;
  url: string;
  score: number;
  comments: number;
  time: number;
  path: number[];
};

type LinkDB = {
  path: number[];
  title: string;
};

async function searchFolders(query: string): Promise<Link[]> {
  // We remove the arguments from the query
  const { finalQuery } = parseQuery(query);

  // Find the folders using the LIKE %% operator
  const folders = await sql<LinkDB[]>`
        SELECT
            path,
            title
        FROM hn_paths
        WHERE title ILIKE ${"%" + finalQuery.trim() + "%"}
        LIMIT 20;`;
  // trim to remove the last space

  return folders.map((elem) => ({
    title: elem.title,
    path: "/" + elem.path.join("/"),
  }));
}

async function searchArticles(query: string): Promise<Article[]> {
  let { finalQuery, score, comment, before, after } = parseQuery(query);

  // Short circuit if the query is empty
  if (finalQuery.trim() === "") {
    return [];
  }

  // Add a maximum length to the query
  finalQuery = finalQuery.slice(0, 300);

  // Get the embeddings of the query
  const embeddings = await getEmbeddings(finalQuery);

  // Get the articles
  const articles = await sql<ArticleDB[]>`
    SELECT
        hn_embeddings.id,
        title,
        url,
        score,
        descendants as comments,
        time,
        path
    FROM hn_embeddings
    INNER JOIN hn_post ON hn_embeddings.id = hn_post.id
    WHERE title IS NOT NULL ${score ? sql`AND score >= ${score}` : sql``}
    ${comment ? sql`AND comment LIKE ${comment}` : sql``}
    ${before ? sql`AND time <= ${before}` : sql``}
    ${after ? sql`AND time >= ${after}` : sql``}
    ORDER BY embedding <#> ${toSql(embeddings)} LIMIT 20;`;

  return articles.map((elem) => ({
    ...elem,
    path: "/" + elem.path.join("/"),
  }));
}

function parseQuery(query: string) {
  let score = null;
  let comment = null;
  let before = null;
  let after = null;

  // Parse the query
  const queryList = query.split(" ");
  let finalQuery = "";
  for (const elem of queryList) {
    if (elem.startsWith("score:")) {
      score = Number(elem.slice(6));
    } else if (elem.startsWith("points:")) {
      score = Number(elem.slice(7));
    } else if (elem.startsWith("point:")) {
      score = Number(elem.slice(6));
    } else if (elem.startsWith("comment:")) {
      comment = elem.slice(8);
    } else if (elem.startsWith("comments:")) {
      comment = elem.slice(9);
    } else if (elem.startsWith("descendants:")) {
      comment = elem.slice(12);
    } else if (elem.startsWith("before:")) {
      before = Number(elem.slice(7));
    } else if (elem.startsWith("after:")) {
      after = Number(elem.slice(6));
    } else {
      finalQuery += elem + " ";
    }
  }
  // Shrinking the finalQuery to 300 characters
  finalQuery = finalQuery.slice(0, 300);
  return { finalQuery, score, comment, before, after };
}

/**
 * Search for a string in the database using the OpenAI API embedding
 * @param query A string to search
 *
 * Note : arguments can be added to the query to filter the results
 * "score:" to filter by score
 * "comment:" to filter by comment
 * "before:" to filter by unix timestamp
 * "after:" to filter by unix timestamp
 * @returns A list of folders and articles
 */
async function search(
  query: string
): Promise<{ folders: Link[]; articles: Article[] }> {
  let articles: Article[] = [];
  let folders: Link[] = [];
  try {
    articles = await searchArticles(query);
    folders = await searchFolders(query);
  } catch (error) {
    console.error(error);
  }

  return {
    folders: folders,
    articles: articles,
  };
}

export default search;
