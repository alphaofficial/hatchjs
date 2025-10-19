const VIEWS = ['About', 'Home', 'User', 'Users'] as const;

export type PageName = (typeof VIEWS)[number];