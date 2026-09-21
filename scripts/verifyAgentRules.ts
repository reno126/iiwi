import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

interface RuleViolation {
  file: string;
  line: number;
  rule: string;
  message: string;
}

const VIOLATIONS: RuleViolation[] = [];

const TARGET_DIRECTORIES = [
  "app",
  "components",
  "lib",
  "serverActions",
  "schemas",
  "tests",
  "scripts",
];

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const KNOWN_ERROR_MESSAGES = [
  "Pole jest wymagane",
  "Niepoprawny format",
  "Błędny format",
  "Ten adres e-mail jest już zajęty",
  "Niepoprawne dane logowania",
  "Opinia jest za krótka",
  "Wystąpił błąd",
];

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(fullPath));
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function checkZeroComments(filePath: string, sourceFile: ts.SourceFile): void {
  const fullText = sourceFile.getFullText();
  const reportedPositions = new Set<number>();

  function inspectNode(node: ts.Node) {
    const leading =
      ts.getLeadingCommentRanges(fullText, node.getFullStart()) || [];
    const trailing = ts.getTrailingCommentRanges(fullText, node.getEnd()) || [];

    for (const range of [...leading, ...trailing]) {
      if (!reportedPositions.has(range.pos)) {
        reportedPositions.add(range.pos);
        const line =
          sourceFile.getLineAndCharacterOfPosition(range.pos).line + 1;
        const preview = fullText
          .substring(range.pos, range.end)
          .trim()
          .slice(0, 50);

        VIOLATIONS.push({
          file: filePath,
          line,
          rule: "Zero Comments Policy (AGENTS.md Sec. 3)",
          message: `Comment detected: "${preview}"`,
        });
      }
    }

    ts.forEachChild(node, inspectNode);
  }

  inspectNode(sourceFile);
}

function checkEmptyPropsInterfaces(
  filePath: string,
  sourceFile: ts.SourceFile,
): void {
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      if (node.name.text.endsWith("Props") && node.members.length === 0) {
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        VIOLATIONS.push({
          file: filePath,
          line,
          rule: "Components without Props (AGENTS.md Sec. 4.5)",
          message: `Empty interface "${node.name.text}" is forbidden. Omit props interface when component takes no props.`,
        });
      }
    }

    if (
      ts.isFunctionDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node)
    ) {
      if (node.parameters.length === 1) {
        const param = node.parameters[0];
        if (
          ts.isObjectBindingPattern(param.name) &&
          param.name.elements.length === 0
        ) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(param.getStart()).line + 1;
          VIOLATIONS.push({
            file: filePath,
            line,
            rule: "Components without Props (AGENTS.md Sec. 4.5)",
            message:
              "Empty prop destructuring ({}: Props) is forbidden. Omit props argument completely.",
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function checkSchemaConventions(
  filePath: string,
  sourceFile: ts.SourceFile,
): void {
  const normalized = filePath.replace(/\\/g, "/");
  if (!normalized.includes("/schemas/")) return;

  const fileName = path.basename(filePath);
  if (fileName === "schema.ts" || fileName === "index.ts") {
    VIOLATIONS.push({
      file: filePath,
      line: 1,
      rule: "Schema Domain Separation (AGENTS.md Sec. 6.1)",
      message:
        "Monolithic schema.ts or index.ts is forbidden. Split schemas into dedicated domain files.",
    });
  }

  function visit(node: ts.Node) {
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const varName = decl.name.text;
          if (
            varName.toLowerCase().endsWith("schema") &&
            !varName.endsWith("ERRORS") &&
            !varName.endsWith("MESSAGES")
          ) {
            const firstChar = varName.charAt(0);
            if (firstChar !== firstChar.toLowerCase()) {
              const line =
                sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line +
                1;
              VIOLATIONS.push({
                file: filePath,
                line,
                rule: "Schema Naming Convention (AGENTS.md Sec. 6.2)",
                message: `Schema constant "${varName}" must be camelCase ending with Schema (e.g. loginSchema).`,
              });
            }
          }
        }
      }
    }

    if (
      ts.isTypeAliasDeclaration(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const typeName = node.name.text;
      if (typeName.toLowerCase().endsWith("input")) {
        const firstChar = typeName.charAt(0);
        if (firstChar !== firstChar.toUpperCase()) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          VIOLATIONS.push({
            file: filePath,
            line,
            rule: "Schema Inferred Type Naming (AGENTS.md Sec. 6.2)",
            message: `Inferred schema type "${typeName}" must be PascalCase ending with Input (e.g. LoginInput).`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function isTestAssertionLine(line: string): boolean {
  return (
    line.includes("expect(") ||
    line.includes("getByRole(") ||
    line.includes("getByText(") ||
    line.includes("findByText(") ||
    line.includes("toBe(") ||
    line.includes("toEqual(") ||
    line.includes("toHaveBeenCalledWith(")
  );
}

function checkMagicLiteralsInTests(filePath: string, content: string): void {
  const normalized = filePath.replace(/\\/g, "/");
  if (!normalized.includes("/tests/")) return;

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isTestAssertionLine(line)) continue;

    for (const knownError of KNOWN_ERROR_MESSAGES) {
      if (line.includes(`"${knownError}`) || line.includes(`'${knownError}`)) {
        VIOLATIONS.push({
          file: filePath,
          line: i + 1,
          rule: "Single Source of Truth for Error Messages (AGENTS.md Sec. 7.1)",
          message: `Hardcoded error literal "${knownError}..." found in test assertion. Import from schema error dictionary instead.`,
        });
      }
    }
  }
}

function checkContextProviderMemoization(
  filePath: string,
  sourceFile: ts.SourceFile,
): void {
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = ts.isJsxElement(node)
        ? node.openingElement.tagName.getText(sourceFile)
        : node.tagName.getText(sourceFile);

      if (tag.endsWith(".Provider") || tag.endsWith("Provider")) {
        const attributes = ts.isJsxElement(node)
          ? node.openingElement.attributes.properties
          : node.attributes.properties;

        for (const attr of attributes) {
          if (
            ts.isJsxAttribute(attr) &&
            ts.isIdentifier(attr.name) &&
            attr.name.text === "value"
          ) {
            if (attr.initializer && ts.isJsxExpression(attr.initializer)) {
              const expr = attr.initializer.expression;
              if (
                expr &&
                (ts.isObjectLiteralExpression(expr) ||
                  ts.isArrowFunction(expr) ||
                  ts.isFunctionExpression(expr))
              ) {
                const line =
                  sourceFile.getLineAndCharacterOfPosition(attr.getStart())
                    .line + 1;
                VIOLATIONS.push({
                  file: filePath,
                  line,
                  rule: "Reference Stability & Context Hygiene (AGENTS.md Sec. 5.5)",
                  message: `Inline constructed value "${expr.getText(sourceFile)}" passed to <${tag}>. Wrap context value in useMemo to prevent unnecessary consumer re-renders.`,
                });
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function runVerification(): void {
  const projectRoot = process.cwd();
  const allSourceFiles: string[] = [];

  for (const dir of TARGET_DIRECTORIES) {
    const targetPath = path.join(projectRoot, dir);
    allSourceFiles.push(...collectSourceFiles(targetPath));
  }

  for (const filePath of allSourceFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    checkZeroComments(filePath, sourceFile);
    checkMagicLiteralsInTests(filePath, content);
    checkEmptyPropsInterfaces(filePath, sourceFile);
    checkSchemaConventions(filePath, sourceFile);
    checkContextProviderMemoization(filePath, sourceFile);
  }

  if (VIOLATIONS.length > 0) {
    console.error(
      `\n❌ AGENTS.md Architecture Verification Failed (${VIOLATIONS.length} violations found):\n`,
    );

    for (const v of VIOLATIONS) {
      const relativePath = path.relative(projectRoot, v.file);
      console.error(
        `  • [${v.rule}] ${relativePath}:${v.line}\n    ${v.message}\n`,
      );
    }

    process.exit(1);
  }

  console.log(
    `\n✅ AGENTS.md Architecture Verification Passed (0 violations across ${allSourceFiles.length} files).\n`,
  );
}

runVerification();
