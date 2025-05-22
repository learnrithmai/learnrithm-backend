export interface User {
  name: string;
  email: string;
  plan: string;
  image: string | null;
  isVerified: boolean;
  howDidYouFindUs: string;
  whoAreYou?: string;
  age: number | null;
  birthDate: Date | null;
}
