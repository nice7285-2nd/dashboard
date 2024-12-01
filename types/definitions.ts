export type User = {
  id: string;
  authKey: string;
  createdAt: Date;
  loginAt: Date | null;
  profileImageUrl: string | null;
  role: string;
  name: string;
  email: string;
  password: string;
};

export type ProjectTable = {
  id: string;
  name: string;
  websiteUrl: string;
};


export type LessonsTable = {
  id: string;
  author: string;
  email: string;
  title: string;
  createdAt: Date;
  path: string;
  user?: {
    id: string;
    name: string;
    profileImageUrl: string | null;
  };
};

export type StudyrecWithUser = {
  id: number;
  email: string;
  author: string;
  title: string;
  path: string;
  views: number;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    profileImageUrl: string | null;
  };
};

export type UsersTable = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  loginAt: Date;
  profileImageUrl: string;
};  

