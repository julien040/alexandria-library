import { getAllArticles } from "./getAllArticles";
import { getAllPath } from "./getAllPath";
import type { Article } from "./getAllArticles";

interface Link {
  title: string;
  path: string;
}

interface dictType {
  [key: string]: {
    title?: string;
    subfolder: Link[];
    articles: Article[];
    type: "folder" | "leaf";
    breadcrumbs: Link[];
  };
}

async function getDataPath() {
  const articles = await getAllArticles();
  const paths = await getAllPath();

  // Create a dictionnary empty with only the path
  const dict: dictType = {};
  for (const elem of paths) {
    dict[elem.path] = {
      subfolder: [],
      articles: [],
      type: elem.type,
      title: elem.title,
      breadcrumbs: [],
    };
  }
  // Fill the dictionnary with the articles
  for (const elem of articles) {
    const { path } = elem;
    dict[path].articles.push(elem);
  }

  // Fill the dictionnary with the subfolders
  for (const elem of paths) {
    const { path, type, title } = elem;
    // Remove the two last char of the path so that it is the parent folder
    const parent = path.slice(0, -2);
    // If the path is not the root folder
    if (parent.length > 0) {
      // Add the subfolder to the parent folder
      dict[parent].subfolder.push({
        title,
        path,
      });
    }
  }

  // Compute the breadcrumbs
  for (const elem of paths) {
    const { path } = elem;

    // Add itself to the breadcrumbs
    dict[path].breadcrumbs.push({
      title: dict[path].title ?? "Unknown",
      path,
    });

    // Remove the two last char of the path so that it is the parent folder
    let parent = path.slice(0, -2);
    while (parent.length > 0) {
      // Add the subfolder to the parent folder
      dict[path].breadcrumbs.push({
        title: dict[parent].title ?? "Unknown",
        path: parent,
      });
      parent = parent.slice(0, -2);
    }

    // Add home to the breadcrumbs
    dict[path].breadcrumbs.push({
      title: "Home",
      path: "/",
    });
    // Reverse the breadcrumbs so that the root folder is first
    dict[path].breadcrumbs.reverse();
  }

  return dict;
}

export { getDataPath };
export type { Link, Article };
