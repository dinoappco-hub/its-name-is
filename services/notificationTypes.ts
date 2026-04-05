export type NotificationType = 'vote' | 'name_suggestion' | 'featured' | 'milestone';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  objectId: string;
  objectImageUri: string;
  fromUser: {
    username: string;
    avatar: string;
    isPremium: boolean;
  };
  read: boolean;
  createdAt: string;
}
