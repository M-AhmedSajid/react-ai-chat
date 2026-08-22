import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkStringify from "remark-stringify";
import { visit, SKIP } from "unist-util-visit";

export function cleanMdx(content: string): string {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(content);

  visit(tree, (node, index, parent) => {
    if (!parent || index === undefined) return;

    if (
      node.type === "mdxjsEsm" ||
      node.type === "mdxFlowExpression" ||
      node.type === "mdxTextExpression"
    ) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }

    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      if ("children" in node && Array.isArray(node.children)) {
        parent.children.splice(index, 1, ...node.children);
        return [SKIP, index];
      }

      parent.children.splice(index, 1);
      return [SKIP, index];
    }
  });

  return unified().use(remarkStringify).stringify(tree).trim();
}
