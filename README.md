# 🔄 MongoDB to DynamoDB Exporter v1.0

This Node.js script exports all databases and collections from a MongoDB instance to JSON files formatted for DynamoDB import.

## ✨ Features

- 🔌 Connects to MongoDB and exports all databases (except admin, local, and config)
- 🔄 Processes each collection and formats documents for DynamoDB
- 🔢 Handles various data types including numbers, strings, booleans, dates, arrays, and nested objects
- ✅ Validates numeric values and converts non-finite numbers to strings
- 📊 Provides progress updates during the export process
- 📁 Creates an output folder with JSON files for each collection

## 📋 Prerequisites

- 🟢 Node.js (version 12 or higher recommended)
- 📦 npm (Node Package Manager)
- 🔑 Access to a MongoDB instance

## 🛠️ Installation

1. Clone this repository:
   ```
   git clone https://github.com/zerodatatcp/mongodb-to-dynamodb-exporter
   cd mongodb-to-dynamodb-exporter
   ```

2. Install the required npm packages:
   ```
   npm install mongodb
   ```

## 🚀 Usage

1. Set the MongoDB connection URI as an environment variable (optional):
   ```
   export MONGODB_URI='mongodb://your-mongodb-uri'
   ```
   If not set, it will default to 'mongodb://localhost:27017'.

2. Run the script:
   ```
   node --expose-gc index.js
   ```
   The `--expose-gc` flag is used to enable manual garbage collection.

3. The script will create an 'output' folder in the same directory and generate JSON files for each collection.

## 📤 Output

The script generates JSON files in the 'output' folder. Each file is named in the format `databaseName_collectionName.json` and contains one JSON object per line, formatted for DynamoDB import.

## 📝 Notes

- 🚫 The script skips the '_id' field from MongoDB documents.
- 🔢 Non-finite numbers are converted to strings to comply with DynamoDB's requirements.
- 🖥️ Progress is displayed in the console, updating every 500 processed documents.
- ⚠️ Currently not compatible with collections using Map data type. Compatibility will be added in future updates.
