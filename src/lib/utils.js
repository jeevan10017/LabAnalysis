// A simple class name merging utility.
// You could replace this with the 'clsx' or 'tailwind-merge' libraries.
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}