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

      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER,
        hydration INTEGER,
        exposure REAL,
        growth_index REAL,
        temperature REAL,
        humidity INTEGER,
        battery_panel INTEGER,
        battery_system INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Check if seeded
    const historyCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM history');
    const metricsCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM metrics');

    if (historyCount?.count === 0 && metricsCount?.count === 0) {
       console.log('Seeding SQLite mock data...');
       seedDatabase(db);
    }
    
    console.log('Local SQLite Database initialized successfully');
  } catch (error) {
    console.warn('Error initializing database:', error);
  }
}

function seedDatabase(db: SQLite.SQLiteDatabase) {
  try {
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    
    // Seed Metrics for last 14 days
    const insertMetric = db.prepareSync('INSERT INTO metrics (hydration, exposure, growth_index, temperature, humidity, battery_panel, battery_system, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (let i = 0; i < 14; i++) {
        // Data logic
        const date = new Date(now.getTime() - i * msInDay).toISOString();
        const hydration = 65 + Math.random() * 25; // 65-90
        const exposure = 4 + Math.random() * 4; // 4-8 hrs
        const growth = (14 - i) * 0.8 + Math.random() * 2; // ascending growth
        const temp = 22 + Math.random() * 6; // 22-28
        const humidity = 45 + Math.random() * 15; // 45-60
        const batPanel = 80 + Math.random() * 20; // 80-100
        const batSys = 70 + Math.random() * 25; // 70-95

        insertMetric.executeSync([
          Math.round(hydration), 
          Number(exposure.toFixed(1)), 
          Number(growth.toFixed(1)),
          Number(temp.toFixed(1)),
          Math.round(humidity),
          Math.round(batPanel),
          Math.round(batSys),
          date
        ]);
    }
    insertMetric.finalizeSync();

    // Seed History Events
    const insertHistory = db.prepareSync('INSERT INTO history (action, details, created_at) VALUES (?, ?, ?)');
    
    const events = [
       { action: 'New Leaf Unfurled', details: 'System detected a 15% increase in total surface area. Node health optimal.', daysAgo: 0 },
       { action: 'Watering Cycle', details: 'Automated 150ml hydration triggered. Soil moisture stabilized.', daysAgo: 1 },
       { action: 'Fertilization Cycle', details: 'Organic nitrogen-rich supplement added to irrigation system.', daysAgo: 2 },
       { action: 'Temperature Alert', details: 'Ambient temperature reached 28°C. Active cooling fan engaged briefly.', daysAgo: 4 },
       { action: 'Repotting Event', details: 'Transferred to 12" terracotta vessel. Root aeration increased.', daysAgo: 8 },
       { action: 'Pruning Session', details: 'Removed dead leaves to promote healthy growth.', daysAgo: 12 },
    ];

    events.forEach(evt => {
        const date = new Date(now.getTime() - evt.daysAgo * msInDay).toISOString();
        insertHistory.executeSync([evt.action, evt.details, date]);
    });
    insertHistory.finalizeSync();

    console.log('Seed ejecutado con éxito');
  } catch (err) {
    console.warn('Error seeding DB:', err);
  }
}

export function getDb() {
  return SQLite.openDatabaseSync('garden.db');
}
