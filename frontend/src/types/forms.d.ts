
export type SignUpForm = {
  name: string;
  email: string;
  password: string;
  companyName: string;
};


export type LoginForm={
  email: string;
  password: string;
  role: "Staff" | "Manager"
}