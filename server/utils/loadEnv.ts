import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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
	path.join(process.cwd(), envFile),
	path.join(process.cwd(), '.env.local'),
	path.join(process.cwd(), '.env'),
	path.join(__dirname, '../../../../', envFile),
	path.join(__dirname, '../../../../.env.local'),
	path.join(__dirname, '../../../../.env'),
	path.join(__dirname, '../../', envFile),
	path.join(__dirname, '../../.env.local'),
	path.join(__dirname, '../../.env')
];

let envPath = '.env'; // fallback
for (const testPath of possiblePaths) {
	if (fs.existsSync(testPath)) {
		envPath = testPath;
		break;
	}
}

console.log('[ENV] Current working directory:', process.cwd());
console.log('[ENV] Module directory:', __dirname);
console.log('[ENV] Loading environment from:', envPath);
console.log('[ENV] File exists:', fs.existsSync(envPath));

dotenv.config({ path: envPath });

export default envPath;
