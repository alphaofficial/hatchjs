const VIEWS = ['About', 'Home', 'User', 'Users', 'Dashboard', 'Auth/Login', 'Auth/Register'] as const;

export type PageName = (typeof VIEWS)[number];