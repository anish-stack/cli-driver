import AsyncStorage from '@react-native-async-storage/async-storage';


export const saveData = async (key: string, value: any): Promise<void> => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
    console.log(`✅ Data saved: ${key}`);
  } catch (error) {
    console.error(`❌ Error saving data to AsyncStorage for key "${key}":`, error);
  }
};


export const getData = async (key: string): Promise<any> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value; // Return as string if not JSON
    }
  } catch (error) {
    console.error(`❌ Error retrieving data from AsyncStorage for key "${key}":`, error);
    return null;
  }
};


export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ Data removed: ${key}`);
  } catch (error) {
    console.error(`❌ Error removing data from AsyncStorage for key "${key}":`, error);
  }
};
