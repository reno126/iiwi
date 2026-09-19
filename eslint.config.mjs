import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const zeroCommentsPlugin = {
  rules: {
    "no-comments": {
      meta: {
        type: "problem",
        docs: {
          description: "Strictly enforce Zero Comments Policy from AGENTS.md",
        },
        schema: [],
      },
      create(context) {
        return {
          Program() {
            const comments = context.sourceCode.getAllComments();
            for (const comment of comments) {
              context.report({
                loc: comment.loc,
                message:
                  "Comments are strictly forbidden by AGENTS.md (Zero Comments Policy). Use self-descriptive naming and named functions instead.",
              });
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "agent-rules": zeroCommentsPlugin,
    },
    rules: {
      "@next/next/no-img-element": "off",
      "agent-rules/no-comments": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "no-empty-pattern": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "prisma/generated/**",
  ]),
]);

export default eslintConfig;
