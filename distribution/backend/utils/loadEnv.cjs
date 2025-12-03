"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// In compiled CommonJS, __dirname will be server/dist/server/utils/
// We need to go up to the app root where .env is located
// Development: server/utils/ -> go up 2 levels to project root
// Production: server/dist/server/utils/ -> already at /home/gamers/nodejs/forgesteel-api/server/dist/server/utils
//             so we just need to check current directory first, then go up
// Determine environment (development by default when not in Passenger)
const isProduction = !!(process.env.PASSENGER_BASE_URI || process.env.PASSENGER_APP_ENV);
const envFile = isProduction ? '.env' : '.env.development';
// Try multiple possible .env locations
const possiblePaths = [
    path_1.default.join(process.cwd(), envFile),
    path_1.default.join(process.cwd(), '.env.local'),
    path_1.default.join(process.cwd(), '.env'),
    path_1.default.join(__dirname, '../../../../', envFile),
    path_1.default.join(__dirname, '../../../../.env.local'),
    path_1.default.join(__dirname, '../../../../.env'),
    path_1.default.join(__dirname, '../../', envFile),
    path_1.default.join(__dirname, '../../.env.local'),
    path_1.default.join(__dirname, '../../.env')
];
let envPath = '.env'; // fallback
for (const testPath of possiblePaths) {
    if (fs_1.default.existsSync(testPath)) {
        envPath = testPath;
        break;
    }
}
console.log('[ENV] Current working directory:', process.cwd());
console.log('[ENV] Module directory:', __dirname);
console.log('[ENV] Loading environment from:', envPath);
console.log('[ENV] File exists:', fs_1.default.existsSync(envPath));
dotenv_1.default.config({ path: envPath });
exports.default = envPath;
//# sourceMappingURL=loadEnv.js.map