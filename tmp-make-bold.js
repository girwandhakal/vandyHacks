const fs = require('fs');

const replaceInFile = (path, replacements) => {
  try {
    let content = fs.readFileSync(path, 'utf8');
    for (const [target, replacement] of replacements) {
      content = content.split(target).join(replacement);
    }
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Updated ${path}`);
  } catch(e) {
    console.error(`Skipping ${path}: ${e.message}`);
  }
};

// 1. Globals
replaceInFile('src/app/globals.css', [
  ['@apply text-lg font-semibold tracking-tight text-charcoal;', '@apply text-xl font-extrabold tracking-tight text-[#111111];']
]);

// 2. Page Header
replaceInFile('src/components/shared/page-header.tsx', [
  ['text-2xl font-bold tracking-tight', 'text-3xl font-extrabold tracking-tight text-[#111111]'],
  ['text-sm text-neutral-500 max-w-2xl', 'text-base font-semibold text-neutral-600 max-w-2xl']
]);

// 3. Components globally
const compReps = [
  ['h3 className="font-semibold text-charcoal text-base"', 'h3 className="font-bold text-[#111111] text-lg"'],
  ['h4 className="font-semibold text-sm', 'h4 className="font-extrabold text-[#111111] text-base'],
  ['p className="text-sm font-medium text-charcoal"', 'p className="text-base font-bold text-[#111111]"'],
  ['h2 className="text-lg font-semibold text-charcoal', 'h2 className="text-xl font-bold text-[#111111] tracking-tight'],
  ['text-sm font-bold text-charcoal', 'text-base font-extrabold text-[#111111]'],
  ['p className="text-xs text-neutral-400 mb-1"', 'p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1"'],
  ['text-sm font-medium text-neutral-500', 'text-sm font-bold text-neutral-600 tracking-wide'],
  ['text-sm font-medium text-charcoal', 'text-base font-bold text-[#111111]']
];

replaceInFile('src/app/page.tsx', compReps);
replaceInFile('src/app/documents/page.tsx', compReps);
replaceInFile('src/app/scenarios/page.tsx', compReps);
