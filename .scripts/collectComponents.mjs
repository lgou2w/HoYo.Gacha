/**
 * Scans all TypeScript files matched by `SCAN_DIRS` and collects named imports
 * from `TARGET_MODULES` (FluentUI), then classifies each imported symbol as
 * either a component or a utility.
 *
 * Classification rules:
 * - Names starting with a lowercase letter (e.g. `makeStyles`, `tokens`)
 *   are treated as utilities.
 * - Names starting with an uppercase letter but ending with a known utility
 *   suffix (e.g. `ButtonProps`, `ButtonState`, `ButtonContext`)
 *   are treated as utilities.
 * - All remaining uppercase-first names (e.g. `Button`, `Spinner`, `Theme`)
 *   are treated as components.
 *
 * Note: TypeScript cannot statically determine whether a symbol is a React
 * component, so this script relies on naming conventions instead of type
 * analysis.
 */

import fs from 'node:fs'
import { glob } from 'glob'
import ts, { ScriptKind, ScriptTarget } from 'typescript'

const TARGET_MODULES = new Set(['@fluentui/react-components'])
const SCAN_DIRS = ['app/**/*.{ts,tsx}']

// Uppercase-first names ending with any of these suffixes are classified
// as utilities rather than components.
const UTILITY_SUFFIXES = ['Props', 'State', 'Config', 'Type', 'Context', 'Ref', 'Provider', 'Tokens', 'Hooks']

function isUtilityName (name) {
  if (/^[a-z]/.test(name)) {
    return true
  } else {
    return UTILITY_SUFFIXES.some((suffix) => name.endsWith(suffix))
  }
}

const components = new Set() // For components
const utilities = new Set() // For utilities

for (const pattern of SCAN_DIRS) {
  const files = await glob(pattern, {
    cwd: process.cwd(),
    ignore: [
      '**/node_modules/**'
    ],
  })

  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf-8'),
      ScriptTarget.Latest,
      true,
      file.endsWith('.tsx')
        ? ScriptKind.TSX
        : ScriptKind.TS,
    )

    source.forEachChild((node) => {
      if (ts.isImportDeclaration(node)
        && ts.isStringLiteral(node.moduleSpecifier)
        && TARGET_MODULES.has(node.moduleSpecifier.text)
      ) {
        const namedBindings = node.importClause?.namedBindings
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          namedBindings.elements.forEach((el) => {
            const original = el.propertyName?.text ?? el.name.text
            if (isUtilityName(original)) {
              utilities.add(original)
            } else {
              components.add(original)
            }
          })
        }
      }
    })
  }
}

// Output
const sortedComponents = [...components].sort()
const sortedUtilities = [...utilities].sort()
console.log(
  '===== Found %d components (Maybe) =====\n%s',
  sortedComponents.length,
  sortedComponents.join(', '),
)
console.log()
console.log(
  '===== Found %d utilities =====\n%s',
  sortedUtilities.length,
  sortedUtilities.join(', '),
)
