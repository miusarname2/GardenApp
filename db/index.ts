import * as SQLite from 'expo-sqlite';

export function setupDatabase() {
  try {
    const db = SQLite.openDatabaseSync('garden.db');
    
    // Create basic tables for future use (Sensors and History)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sensors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        mac_address TEXT UNIQUE,
        last_humidity INTEGER,
        last_temperature INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER,
        action TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Local SQLite Database initialized successfully');
  } catch (error) {
    console.warn('Error initializing database:', error);
  }
}

export function getDb() {
  return SQLite.openDatabaseSync('garden.db');
}
