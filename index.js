const { MongoClient } = require('mongodb');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function exportAllDatabases() {
    let client;
    try {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('🔌 Attempting to connect to MongoDB...');
        await client.connect();
        console.log('✅ Connection established successfully');

        const admin = client.db().admin();
        const databases = await admin.listDatabases();

        const outputFolder = path.join(__dirname, 'output');
        await fsPromises.mkdir(outputFolder, { recursive: true });
        console.log(`📁 Output folder created at: ${outputFolder}`);

        for (const db of databases.databases) {
            const dbName = db.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            console.log(`📂 Processing database: ${dbName}`);
            const database = client.db(dbName);
            const collections = await database.listCollections().toArray();

            for (const colInfo of collections) {
                await processCollection(database, colInfo, outputFolder, dbName);
                global.gc();
            }
        }

        console.log('🎉 Export completed successfully');
    } catch (error) {
        console.error('❌ Error during export:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Connection closed');
        }
    }
}

async function processCollection(database, colInfo, outputFolder, dbName) {
    const collectionName = colInfo.name;
    console.log(`🔍 Processing collection: ${collectionName}`);

    const collection = database.collection(collectionName);
    const cursor = collection.find({});

    const outputPath = path.join(outputFolder, `${dbName}_${collectionName}.json`);
    const writeStream = fs.createWriteStream(outputPath);

    let counter = 0;
    process.stdout.write(`📊 Documents processed: 0`);

    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const formattedDoc = formatDocument(doc);
        const validatedDoc = validateDocument(formattedDoc);
        writeStream.write(JSON.stringify(validatedDoc) + '\n');
        counter++;

        if (counter % 500 === 0) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`📊 Documents processed: ${counter}`);
        }
    }

    process.stdout.write('\n');
    writeStream.end();
    console.log(`💾 Collection ${collectionName} exported to ${outputPath}. Total documents: ${counter}`);
}

function formatDocument(doc) {
    const formattedDoc = { "Item": {} };
    for (const [key, value] of Object.entries(doc)) {
        if (key === '_id') continue;
        formattedDoc.Item[key] = formatValue(value);
    }
    return formattedDoc;
}

function formatValue(value) {
    if (typeof value === 'number') {
        if (Number.isFinite(value)) {
            return { "N": value.toString() };
        } else {
            return { "S": value.toString() };
        }
    } else if (typeof value === 'string') {
        return { "S": value };
    } else if (typeof value === 'boolean') {
        return { "BOOL": value };
    } else if (value instanceof Date) {
        return { "S": value.toISOString() };
    } else if (Array.isArray(value)) {
        return { "L": value.map(formatValue) };
    } else if (value === null) {
        return { "NULL": true };
    } else if (typeof value === 'object') {
        const formattedObj = {};
        for (const [key, innerValue] of Object.entries(value)) {
            formattedObj[key] = formatValue(innerValue);
        }
        return { "M": formattedObj };
    }
    return { "S": JSON.stringify(value) };
}

function validateDocument(doc) {
    for (const [key, value] of Object.entries(doc.Item)) {
        if (value.N && !Number.isFinite(parseFloat(value.N))) {
            console.warn(`Warning: Non-numeric value found for key "${key}": ${value.N}`);
            doc.Item[key] = { "S": value.N.toString() };
        }
    }
    return doc;
}

exportAllDatabases().catch(console.error);
