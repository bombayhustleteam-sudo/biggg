import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  bio: string;
  photoURL: string;
  bannerURL: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  dateOfBirth: string | null;
  createdAt: Timestamp;
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    photoURL: string;
  };
  text: string;
  imageURL: string | null;
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  createdAt: Timestamp;
  replyToId: string | null;
}
