import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const VERSION_KEY = 'app_version';
const HISTORY_KEY = 'history'; // change ONLY if your key is different

export async function runVersionMigration() {
  try {
    const currentVersion =
      Constants.expoConfig?.version ?? 'unknown';

    const storedVersion = await AsyncStorage.getItem(VERSION_KEY);

    if (storedVersion !== currentVersion) {
      await AsyncStorage.removeItem(HISTORY_KEY);
      await AsyncStorage.setItem(VERSION_KEY, currentVersion);
    }
  } catch (err) {
    console.warn('Version migration failed:', err);
  }
}

