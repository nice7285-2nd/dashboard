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
  website_url: string;
};


export type LessonsTable = {
  id: string;
  author: string;
  email: string;
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
  profile_image_url: string;
};  


