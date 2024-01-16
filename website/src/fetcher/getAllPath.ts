import sql from "../database";

interface Path {
  path: string[];
  type: "leaf" | "folder";
  title: string;
}

export async function getAllPath() {
  const paths = await sql<Path[]>`
    SELECT DISTINCT
        hn_paths.path,
        CASE WHEN count(id) > 0 THEN
            'leaf'
        ELSE
            'folder'
        END AS "type",
        title
    FROM
        hn_paths
        LEFT JOIN hn_embeddings ON hn_paths.path = hn_embeddings.path
    GROUP BY
        hn_paths.path
  `;
  return paths.map((path) => ({
    ...path,
    path: "/" + path.path.join("/"),
  }));
}

export type { Path };
