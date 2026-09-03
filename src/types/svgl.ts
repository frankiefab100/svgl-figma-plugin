export interface ThemeOptions {
  dark: string;
  light: string;
}

export interface SVGLogo {
  id: number;
  title: string;
  category: string | string[];
  route: string | ThemeOptions;
  url: string;
  wordmark?: string | ThemeOptions;
  brandUrl?: string;
}

export interface Category {
  category: string;
  total: number;
}

export type LogoVariant = "light" | "dark";
export type ImportMode = "svg" | "component";
export type PlacementMode = "cursor" | "new-page";
export type LayoutMode = "grid" | "row";

export interface ImportSettings {
  defaultSize: number;
  importMode: ImportMode;
  placement: PlacementMode;
  cacheEnabled: boolean;
}

export interface BatchImportItem {
  logo: SVGLogo;
  variant: LogoVariant;
}
