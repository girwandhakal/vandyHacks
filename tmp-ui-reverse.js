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

const compReps = [
  ['text-sm font-medium text-white', 'text-sm font-medium text-charcoal'],
  ['text-lg font-semibold text-white', 'text-lg font-semibold text-charcoal'],
  ['font-semibold text-white text-base', 'font-semibold text-charcoal text-base'],
  ['text-sm text-white truncate', 'text-sm text-charcoal truncate'],
  ['text-sm font-bold text-white', 'text-sm font-bold text-charcoal'],
  ['text-2xl font-bold text-white', 'text-2xl font-bold text-charcoal'],
  ['text-xl font-bold text-white', 'text-xl font-bold text-charcoal'],
  ['text-xs font-semibold text-white', 'text-xs font-semibold text-charcoal'],
  ['text-xs text-white pb-2', 'text-xs text-charcoal pb-2'],
  ['text-xs font-medium text-white', 'text-xs font-medium text-charcoal'],
  ['bg-white/5 backdrop-blur-md hover:bg-white/10', 'bg-white/80 backdrop-blur-md hover:bg-white shadow-sm'],
  ['bg-[rgba(255,255,255,0.03)] border border-white/10', 'bg-white border border-neutral-100 shadow-sm'],
  ['bg-white/5 border border-white/5', 'bg-white border border-neutral-100'],
  ['border-white/10 shadow-lg bg-[rgba(255,255,255,0.03)]', 'border-neutral-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] bg-white'],
  ['divide-white/10', 'divide-neutral-100'],
  ['border-t border-white/10', 'border-t border-neutral-100'],
  ['bg-white/10 hover:bg-white/20 py-2.5 rounded-xl transition-colors shadow-sm border border-white/5', 'bg-charcoal hover:bg-charcoal-light py-2.5 rounded-xl transition-colors shadow-sm'],
  ['border border-white/10 bg-white/5', 'border border-neutral-100 bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'],
  ['border border-white/10 text-sm bg-white/5', 'border border-neutral-200 text-sm bg-white/50'],
  ['hover:border-white/20 hover:bg-white/10', 'hover:border-neutral-200 hover:bg-white/50'],
  ['bg-[rgba(255,255,255,0.03)] border-white/5 text-neutral-400', 'bg-white border-neutral-100 text-neutral-400'],
  ['border-dashed border-white/20 hover:border-accent hover:bg-white/10', 'border-dashed border-neutral-200 hover:border-accent hover:bg-white/50'],
  ['border-white/20 rounded-2xl bg-white/5', 'border-neutral-200 rounded-2xl bg-white/50']
];

replaceInFile('src/app/page.tsx', compReps);
replaceInFile('src/app/documents/page.tsx', compReps);
replaceInFile('src/app/scenarios/page.tsx', compReps);
