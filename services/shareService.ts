import { Share, Platform } from 'react-native';
import { config } from '../constants/config';

const APP_URL = 'https://itsnameis.app';

/**
 * Share an individual object submission with friends.
 */
export async function shareObject(params: {
  objectId: string;
  topName?: string;
  imageUri?: string;
  submitterName?: string;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const { objectId, topName, submitterName } = params;
    const objectUrl = `${APP_URL}/object/${objectId}`;

    const nameText = topName ? `"${topName}"` : 'an unnamed object';
    const byText = submitterName ? ` by ${submitterName}` : '';

    const message = `Check out ${nameText}${byText} on ${config.appName}! Can you think of a better name? 🤔\n\n${objectUrl}`;

    const result = await Share.share(
      Platform.select({
        ios: { message, url: objectUrl },
        default: { message },
      }) as any,
      { dialogTitle: `Share from ${config.appName}` },
    );

    return {
      success: result.action === Share.sharedAction,
      error: null,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sharing failed' };
  }
}

/**
 * Share the app itself with friends.
 */
export async function shareApp(): Promise<{ success: boolean; error: string | null }> {
  try {
    const message = `I am naming everything I own on ${config.appName} — my vacuum, my car, my stuffed animals. Come join the fun and name yours! 🦕\n\n${APP_URL}`;

    const result = await Share.share(
      Platform.select({
        ios: { message, url: APP_URL },
        default: { message },
      }) as any,
      { dialogTitle: `Share ${config.appName}` },
    );

    return {
      success: result.action === Share.sharedAction,
      error: null,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sharing failed' };
  }
}
