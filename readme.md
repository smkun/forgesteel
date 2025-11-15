# Forge Steel - Draachenmar Edition

**FORGE STEEL** is a hero builder app for **DRAW STEEL**, originally designed by [Andy Aiken](mailto:andy.aiken@live.co.uk).

This is the **Draachenmar Edition** - an enhanced fork with custom content, backend services, and campaign management features.

- **Original App**: [andyaiken.github.io/forgesteel](https://andyaiken.github.io/forgesteel/)
- **Original Repository**: [github.com/andyaiken/forgesteel](https://github.com/andyaiken/forgesteel)

## Heroes

With this app you can create heroes using the **DRAW STEEL** core rules.

![Hero Edit](./src/assets/screenshots/hero-edit.png)
Here is a hero being edited.

![Hero Sheet](./src/assets/screenshots/hero-sheet-interactive.png)
This shows a hero's character sheet.

![Hero State](./src/assets/screenshots/hero-state.png)
Here we can see the hero being played in a session.

![Hero Roll](./src/assets/screenshots/hero-roll.png)
The player is making the power roll for one of the hero's abilities.

## Draachenmar Edition Features

This enhanced fork includes several major additions beyond the original Forge Steel app:

### Custom Content - Draachenmar Sourcebook

- **21+ Custom Ancestries** including:
  - Angulotl (amphibious explorers)
  - Aurealgar (radiant celestial beings)
  - Lizardfolk (Ssar'uk speakers)
  - Verminari (resilient rodent-folk with Szetch language)
  - Plumari species: Falcar (Medium), Strigara (Large), Zefiri (Small) - winged bird-folk with Aeryn language
  - Seraphite, and many more
- **Custom Ancestral Cultures** with unique languages and traditions
- **Additive Architecture**: Core + Draachenmar sourcebooks work together (not replacement)

### Backend Services & Authentication

- **Firebase Authentication** for secure multi-user access
- **MySQL Database** for persistent character storage
- **Role-Based Access Control**:
  - Players manage their own characters
  - GMs oversee campaign characters
  - Admin access for system management
- **RESTful API** built with Express and TypeScript

### Campaign Management

- **Multi-User Campaigns** with player and GM roles
- **Character Assignment** to campaigns
- **Campaign Projects System**:
  - Hierarchical project tracking with point-based goals
  - Character-specific project ownership
  - Progress tracking with audit history
  - Aggregate progress calculation for sub-projects
  - Role-based project permissions

### Technical Enhancements

- **Server-Side Validation** for all operations
- **Soft Delete** functionality for data recovery
- **Migration System** for schema updates
- **Development Environment** with hot-reload and API proxy
- **Comprehensive Documentation** in `claudedocs/` directory

## Homebrew

You can also use this app to create homebrew hero-building elements - ancestries, classes, kits, and so on.

![Library](./src/assets/screenshots/library.png)
Here we can see the list of elements that can be homebrewed. To create a homebrew element you can create it from whole cloth, or copy an official element.

![Homebrew](./src/assets/screenshots/homebrew.png)
Here we can see a homebrew kit being created.

## Legal

**FORGE STEEL** is an independent product published under the DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC.

**DRAW STEEL** © 2024 MCDM Productions, LLC.

## Credits

### Original Forge Steel

- **Creator**: [Andy Aiken](mailto:andy.aiken@live.co.uk)
- **Repository**: [github.com/andyaiken/forgesteel](https://github.com/andyaiken/forgesteel)
- **License**: DRAW STEEL Creator License

### Draachenmar Edition

- **Fork Maintainer**: Scott Kunian ([scottkunian@gmail.com](mailto:scottkunian@gmail.com))
- **Major Additions**:
  - Draachenmar custom sourcebook with 21+ ancestries
  - Backend services (Express, Firebase Auth, MySQL)
  - Campaign management system
  - Project tracking with hierarchical goals
  - Multi-user authentication and role-based access
- **Development Assistance**: Claude (Anthropic) - Code architecture, implementation, and documentation
- **Documentation**: Comprehensive technical docs in `claudedocs/` directory

### Acknowledgments

- **MCDM Productions** for creating the DRAW STEEL RPG system
- **Andy Aiken** for the exceptional original Forge Steel application
- **Draw Steel Community** for playtest feedback and content inspiration

## Development

**FORGE STEEL - Draachenmar Edition** is written in TypeScript, using React and Ant Design for the frontend, with an Express backend.

### Technology Stack

**Frontend:**

- React 19.2.0
- TypeScript 5.9.3
- Vite 7.1.12
- Ant Design 5.27.6
- LocalForage 1.10.0 (client-side caching)

**Backend:**

- Node.js 20.19+
- Express 4.x
- Firebase Admin SDK 12.x
- MySQL/MariaDB
- TypeScript 5.9.3

### Running Locally

**Frontend Only (Development):**

```bash
npm install
npm run start
```

The app will be available at `http://localhost:5173/forgesteel/`.

**Backend Server (Development):**

```bash
# Build backend
npm run build:backend

# Start backend server
npm run server:dev
```

The API will be available at `http://localhost:4000/api/`.

**Full Stack (Development):**

```bash
# Terminal 1 - Frontend with API proxy
npm run start

# Terminal 2 - Backend server
npm run server:dev
```

Frontend will proxy `/api` requests to the backend automatically.

### Environment Setup

Create `.env.development` file in the project root:

```env
# Database
DATABASE_HOST=your-mysql-host
DATABASE_USER=your-mysql-user
DATABASE_PASSWORD=your-mysql-password
DATABASE_NAME=your-database-name

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Environment
NODE_ENV=development
```

### Quality Checks

Before submitting changes, run the linter and tests:

```bash
npm run check
```

### Contributing

For the **original Forge Steel project**:

- Add feature requests and raise bug reports at [github.com/andyaiken/forgesteel/issues](https://github.com/andyaiken/forgesteel/issues)
- Fork the original repository and raise pull requests there

For the **Draachenmar Edition**:

- This is a personal fork with custom content and backend services
- See `claudedocs/` directory for comprehensive technical documentation
- Major features: Custom ancestries, backend API, campaign management, project tracking
