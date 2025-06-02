import express from 'express';
import { connectDB } from './database/databaseConnection';

const app = express();
const PORT = process.env.PORT || 4000;

app.get('/', (_req, res) => {
    res.send('Hello from TypeScript hello + Node.js!');
});

connectDB()
    .then(() => {
        // Start the server and listen on the specified port
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("error in data base connection:", err);
    });