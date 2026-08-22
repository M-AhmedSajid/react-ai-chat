import { glob } from "glob";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { Document } from "../types.ts";
import { cleanMdx } from "./mdx.ts";

export async function loadDocuments(directory: string): Promise<Document[]> {
  const files = await glob("**/*.{md,mdx,txt}", {
    cwd: directory,
    absolute: true,
  });

  const documents = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, "utf-8");

      const parsed = matter(content);

      const text =
        path.extname(file).toLowerCase() === ".mdx"
          ? cleanMdx(parsed.content)
          : parsed.content.trim();

      return {
        id: path.relative(directory, file),
        text,
      };
    }),
  );

  return documents;
}
