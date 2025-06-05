import express from 'express';
import { connectDB } from './database/databaseConnection';
import cors from "cors";
import productRouter from "./routes/product.route"
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.get('/health-check', (_req, res) => {
    res.send('Hello from TypeScript hello + Node.js!');
});

app.use('/api', productRouter);

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