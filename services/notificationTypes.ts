export type NotificationType = 'vote' | 'name_suggestion' | 'featured' | 'milestone' | 'comment';

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
  };
  read: boolean;
  createdAt: string;
}
