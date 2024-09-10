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

/* 
urlToFetch = "https://api.diffbot.com/v3/article" + "?token=" + \
        quote(getenv("DIFFBOT_API_KEY")) + "&url=" + \
        quote(url).replace("?", "%3F")
*/

async function extractArticleContent(url: string): Promise<string> {
    const urlToFetch =
        "https://api.diffbot.com/v3/article" +
        "?token=" +
        encodeURIComponent(process.env.DIFFBOT_API_KEY ?? "") +
        "&url=" +
        encodeURIComponent(url).replace("?", "%3F");
    const response = await fetch(urlToFetch);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(
            `Unable to fetch the article content (code ${
                response.status
            }). Additional information: ${JSON.stringify(data)}`
        );
    }
    if (data.error) {
        throw new Error(data.error);
    }

    const element = data.objects[0];
    if (!element) {
        throw new Error("The API did not return any article content");
    }
    if (!element.text || typeof element.text !== "string") {
        throw new Error("No article content found from the API");
    }
    if (element.text.length === 0) {
        throw new Error("The extracted article content is empty");
    }
    return element.text;
}

async function searchArticles(query: string): Promise<Article[]> {
    let { finalQuery, score, comment, before, after } = parseQuery(query);

    // Let's check if the final query is an URL
    let queryIsURL = false;
    try {
        const parsed = new URL(finalQuery);
        queryIsURL =
            (parsed.protocol === "http:" || parsed.protocol === "https:") &&
            parsed.hostname !== "";
    } catch (e) {}

    // If the query is an URL, we extract the content
    if (queryIsURL) {
        finalQuery = await extractArticleContent(finalQuery);
    }

    // Short circuit if the query is empty
    if (finalQuery.trim() === "") {
        return [];
    }

    // Add a maximum length to the query
    finalQuery = finalQuery.slice(0, 20000);

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
    ORDER BY embedding <=> ${toSql(embeddings)} LIMIT 30;`;

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
    articles = await searchArticles(query);
    folders = await searchFolders(query);

    return {
        folders: folders,
        articles: articles,
    };
}

export default search;
