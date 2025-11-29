/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Ensure these classes are never purged
    'w-14', 'w-16', 'w-20', 'h-20', 'h-24', 'h-28',
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl',
    'bg-slate-800', 'bg-slate-900', 'bg-slate-950',
    'bg-rose-500', 'bg-pink-600', 'bg-pink-900', 'bg-fuchsia-600',
    'bg-blue-500', 'bg-indigo-600', 'bg-indigo-900', 'bg-purple-700',
    'from-slate-800', 'via-slate-900', 'to-black',
    'from-rose-500', 'via-pink-600', 'to-fuchsia-600',
    'from-blue-500', 'via-indigo-600', 'to-purple-700',
    'border-slate-700', 'border-pink-400', 'border-blue-400',
    'ring-yellow-400', 'ring-offset-gray-900',
    'scale-110', '-translate-y-2', '-translate-y-3',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,jsx,ts,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }