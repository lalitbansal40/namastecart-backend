import express from 'express';
import { connectDB } from './database/databaseConnection';
import cors from "cors";
import productRouter from "./routes/product.route"
import userRouter from "./routes/user.route"
import cartRouter from "./routes/cart.route"
import orderRouter from "./routes/order.route"

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.get('/health-check', (_req, res) => {
    res.send('Hello from TypeScript hello + Node.js!');
});

app.use('/api', productRouter);
app.use('/api', userRouter);
app.use('/api', cartRouter);
app.use('/api', orderRouter);


connectDB()
    .then(async () => {
        // Start the server and listen on the specified port
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("error in data base connection:", err);
    });