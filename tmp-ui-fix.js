const fs = require('fs');

const replaceInFile = (path, replacements) => {
  try {
    let content = fs.readFileSync(path, 'utf8');
    for (const [target, replacement] of replacements) {
      // Global string replacement
      content = content.split(target).join(replacement);
    }
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Updated ${path}`);
  } catch(e) {
    console.error(`Skipping ${path}: ${e.message}`);
  }
};

replaceInFile('src/app/globals.css', [
  ['background-color: #E4E4E7; /* Slightly darkened background for maximum card pop */', 'background-color: #040409;'],
  ['--color-neutral-300: #A1A1AA; /* Was D4D4D8 */', '--color-neutral-300: #D4D4D8;'],
  ['--color-neutral-400: #71717A; /* Was A1A1AA */', '--color-neutral-400: #A1A1AA;'],
  ['--color-neutral-500: #52525B; /* Was 71717A */', '--color-neutral-500: #71717A;'],
  ['--color-neutral-600: #3F3F46; /* Was 52525B */', '--color-neutral-600: #52525B;'],
  ['--color-neutral-700: #27272A; /* Was 3F3F46 */', '--color-neutral-700: #3F3F46;'],
  ['--color-neutral-800: #18181B; /* Was 27272A */', '--color-neutral-800: #27272A;'],
  ['--color-neutral-900: #09090B; /* Was 18181B */', '--color-neutral-900: #18181B;'],
  ['--color-neutral-100: #E4E4E7; /* Was F4F4F5 */', '--color-neutral-100: #F4F4F5;'],
  ['--color-neutral-200: #D4D4D8; /* Was E4E4E7 */', '--color-neutral-200: #E4E4E7;'],
  ['@apply text-charcoal font-sans;', '@apply text-white font-sans;'],
  ['rgba(253, 186, 116, 0.45)', 'rgba(253, 186, 116, 0.15)'],
  ['rgba(244, 114, 182, 0.35)', 'rgba(244, 114, 182, 0.15)'],
  ['rgba(217, 70, 239, 0.40)', 'rgba(217, 70, 239, 0.15)'],
  ['rgba(251, 146, 60, 0.35)', 'rgba(251, 146, 60, 0.15)'],
  ['@apply rounded-[20px] bg-white/95 backdrop-blur-3xl p-6 relative overflow-visible;', '@apply rounded-[20px] bg-[#111118]/60 backdrop-blur-2xl p-6 relative overflow-visible text-white;'],
  ['border: 1px solid rgba(255, 255, 255, 0.6);', 'border: 1px solid rgba(255, 255, 255, 0.05);'],
  ['@apply bg-white;', '@apply bg-[#111118]/80;'],
  ['border: 1px solid rgba(9, 9, 11, 0.25);', 'border: 1px solid rgba(255, 255, 255, 0.1);']
]);

const componentReplacements = [
  ['text-charcoal', 'text-white'],
  ['bg-white/80 backdrop-blur-md hover:bg-white shadow-sm', 'bg-white/5 backdrop-blur-md hover:bg-white/10'],
  ['bg-white border border-neutral-100 shadow-sm', 'bg-[rgba(255,255,255,0.03)] border border-white/10'],
  ['bg-white border border-neutral-100', 'bg-white/5 border border-white/5'],
  ['border-neutral-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] bg-white', 'border-white/10 shadow-lg bg-[rgba(255,255,255,0.03)]'],
  ['divide-neutral-100', 'divide-white/10'],
  ['border-t border-neutral-100', 'border-t border-white/10'],
  ['bg-charcoal hover:bg-charcoal-light py-2.5 rounded-xl transition-colors shadow-sm', 'bg-white/10 hover:bg-white/20 py-2.5 rounded-xl transition-colors shadow-sm border border-white/5'],
  ['border border-neutral-100 bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]', 'border border-white/10 bg-white/5'],
  ['border border-neutral-200 text-sm bg-white/50', 'border border-white/10 text-sm bg-white/5'],
  ['hover:border-neutral-200 hover:bg-white/50', 'hover:border-white/20 hover:bg-white/10'],
  ['bg-white border-neutral-100 text-neutral-400', 'bg-[rgba(255,255,255,0.03)] border-white/5 text-neutral-400'],
  ['border-dashed border-neutral-200 hover:border-accent hover:bg-white/50', 'border-dashed border-white/20 hover:border-accent hover:bg-white/10'],
  ['border-neutral-200 rounded-2xl bg-white/50', 'border-white/20 rounded-2xl bg-white/5']
];

replaceInFile('src/app/page.tsx', componentReplacements);
replaceInFile('src/app/documents/page.tsx', componentReplacements);
replaceInFile('src/app/scenarios/page.tsx', componentReplacements);
