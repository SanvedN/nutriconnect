import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set. Did you forget to set the environment variable?");
}

const client = new MongoClient(process.env.MONGODB_URI, {
  // More flexible SSL settings to handle Atlas connections
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true, // Allow self-signed certs
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // 45 second timeout
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  directConnection: false
});

let database;

async function connect() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    database = client.db('fitness-app');
    console.log('Successfully connected to MongoDB.');

    // Test the connection
    await database.command({ ping: 1 });
    console.log("MongoDB connection test successful!");

    return database;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if we can't connect to the database
  }
}

// Export the connect function to be used in index.ts
export { client, database, connect };