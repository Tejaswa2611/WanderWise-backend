import { importGtfs } from 'gtfs';
import config from '../config/gtfs-config.json';

export const refreshGTFSData = async () => {
  try {
    await importGtfs(config);
    console.log('GTFS data refreshed successfully');
  } catch (error) {
    console.error('GTFS import failed:', error);
  }
};
