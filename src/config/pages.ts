const VIEWS = ['About', 'Home', 'User', 'Users', 'Auth/Login', 'Auth/Register', 'Auth/Dashboard'] as const;

export type PageName = (typeof VIEWS)[number];