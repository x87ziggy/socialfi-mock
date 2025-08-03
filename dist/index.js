"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({ message: 'Local development server' });
});
app.get('/api', (req, res) => {
    res.json({ message: 'Hello from local API!' });
});
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, TypeScript with Express!' });
});
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
exports.default = app;
