import { glob } from "glob";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { Document } from "../types.ts";

export async function loadDocuments(
  directory: string
): Promise<Document[]> {

  const files = await glob(
    "**/*.{md,txt}",
    {
      cwd: directory,
      absolute: true,
    }
  );

  const documents = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(
        file,
        "utf-8"
      );

      const parsed = matter(content);

      return {
        id: path.relative(
          directory,
          file
        ),
        text: parsed.content.trim(),
      };
    })
  );

  return documents;
}