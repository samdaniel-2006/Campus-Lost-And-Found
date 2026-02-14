export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: 'student' | 'staff' | 'admin';
}

export type PostType = 'LOST' | 'FOUND';

export interface Post {
  id: string;
  type: PostType;
  title: string;
  description: string;
  location: string;
  date: string; // ISO string
  category: string;
  imageUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  createdBy: string; // User UID
  creatorName: string;
  creatorPhoto?: string;
  createdAt: number; // Timestamp
  status: 'OPEN' | 'RESOLVED';
}

export const CATEGORIES = [
  'Electronics',
  'ID Cards / Wallets',
  'Keys',
  'Books / Notes',
  'Clothing',
  'Accessories',
  'Others'
];