// Type declarations for packages without @types

declare module 'chardet' {
  export function detectFileSync(path: string): string | null;
}

declare module 'diacritics' {
  export function remove(str: string): string;
}
