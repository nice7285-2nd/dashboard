export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  auth_key: string;
};

export type ProjectTable = {
  id: string;
  name: string;
  website_url: string;
};


export type LessonsTable = {
  id: string;
  author: string;
  title: string;
  created_at: Date;
  path: string;
};


export type UsersTable = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: Date;
  login_at: Date;
};  


