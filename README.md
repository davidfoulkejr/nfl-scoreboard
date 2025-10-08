# NFL Scoreboard Website

A modern web application that displays NFL scoreboards by week using ESPN's API data. Built with Vite, ES6 modules, and modern JavaScript as a Single Page Application (SPA) with bundling and minification.

## Features

### 🏈 Game Information

- **Complete Schedule**: All 18 regular season weeks (Week 1-18)
- **Game Cards**: Individual cards for each game showing:
  - Team cities, names, and official logos
  - Game date, time, and venue
  - Final scores for completed games
  - Betting odds for upcoming games
  - Live game status indicators
  - Broadcast network information
- **Game Details**: Click any game card to view detailed information

### 🎯 Game Detail View

- **Enhanced Game Display**: Full game header with team records and final/live scores
- **Quarter-by-Quarter Box Score**: Complete scoring breakdown by period
- **Team Leaders**: Player statistics for passing, rushing, and receiving leaders
  - Player photos and detailed stats
  - Position and jersey numbers
  - Team affiliations
- **Comprehensive Game Info**: Venue details, betting odds, broadcast networks
- **Easy Navigation**: Back button to return to scoreboard

### 📊 Team Schedule View

- **Full Season Overview**: Complete 18-week schedule for any selected team
- **Game Status Indicators**: Visual markers for completed, live, and upcoming games
- **Team Branding**: Dynamic team colors and styling based on selected team
- **Comprehensive Game Cards**: Date, opponent, scores, and venue information
- **Interactive Navigation**: Click any game to view detailed information
- **Smart Color Contrast**: Automatically adjusts text color based on team color brightness

### 📅 Week Navigation & Routing

- **Previous/Next Buttons**: Navigate chronologically through weeks
- **Week Dropdown**: Jump directly to any specific week
- **Date Ranges**: Shows the date span for each week (e.g., "Nov 12 - Nov 16")
- **Auto-Detection**: Automatically displays the current week on page load
- **URL-Based Navigation**: Shareable links for specific weeks, games, and team schedules
- **Hash Routing**: `/week/3`, `/week/3/game/401772812`, and `/team/LAR` URL structure

### 📱 Responsive Design

- **Mobile Friendly**: Optimized for all screen sizes
- **Touch Navigation**: Easy navigation on mobile devices
- **Adaptive Layout**: Game cards and detail views reorganize based on screen size
- **Mobile-Optimized Detail View**: Specially designed layouts for phone screens

### 🔄 Real-Time Data & Performance

- **ESPN API Integration**: Fetches live data from ESPN's official API
- **Efficient Caching**: Smart data management to avoid repeated API calls
- **Instant Navigation**: No additional loading when switching between views
- **Error Handling**: Graceful fallbacks if API is unavailable
- **Single Page Application**: Fast, seamless user experience

## File Structure

```
nfl-scoreboard/
├── index.html                    # Main SPA HTML structure
├── package.json                  # npm dependencies and build scripts
├── vite.config.js               # Vite build configuration
├── staticwebapp.config.json      # Azure Static Web Apps configuration
├── src/
│   ├── js/
│   │   ├── app.js               # Main application and routing controller
│   │   ├── apiService.js        # ESPN API data management
│   │   ├── scoreboard.js        # Week scoreboard view controller
│   │   ├── gameDetail.js        # Individual game detail view controller
│   │   └── teamSchedule.js      # Team schedule view controller
│   └── styles/
│       └── styles.css           # Complete CSS with responsive design
├── public/
│   ├── favicon.svg              # Custom favicon
│   ├── team-colors.json         # NFL team color definitions
│   └── fantasy-apis/            # API response samples
├── dist/                        # Built production files (generated)
├── .github/
│   └── workflows/
│       └── deploy-to-azure.yml  # GitHub Actions deployment workflow
└── README.md                     # Complete documentation
```

## Technical Implementation

### Modern Build System

- **Vite**: Fast build tool with hot module reload for development
- **ES6 Modules**: Modular JavaScript architecture with proper imports/exports
- **Bundling & Minification**: Optimized production builds with code splitting
- **Source Maps**: Full debugging support in development mode
- **Asset Processing**: Automatic optimization of CSS and static assets

### Data Model

The application uses comprehensive TypeScript-style interfaces to handle ESPN's NFL API data:

- Complete game information (teams, scores, timing)
- Betting odds and lines from multiple providers
- Player statistics and team leaders
- Venue and broadcast details

### API Integration

- **Endpoint**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- **Data Fetching**: Loads all 18 weeks of regular season data on initial page load
- **Caching**: Stores week data in memory to avoid repeated API calls
- **Error Handling**: Comprehensive error states and retry functionality

### Key JavaScript Classes and Functions

#### `NFLApp` Class (Main Controller)

Central application controller that handles:

- Hash-based SPA routing and navigation
- View management and state coordination
- Data initialization and error handling

#### `APIService` Class

Dedicated service for data management:

- ESPN API integration with caching
- Parallel loading of all 18 weeks
- Error handling and retry logic

#### `ScoreboardView` Class

Manages the main week scoreboard display:

- Game card rendering and layout
- Week navigation controls
- Click handlers for game detail navigation

#### `GameDetailView` Class

Handles individual game detail display:

- Quarter-by-quarter box score tables
- Team leader statistics with player photos
- Enhanced game information and venue details

#### `TeamScheduleView` Class

Manages team-specific schedule display:

- Full season schedule rendering for selected team
- Dynamic team color theming and branding
- Game status visualization across the season
- Navigation between team schedules and game details

#### Core Methods

- `NFLApp.handleRouteChange()`: Processes URL hash changes for navigation
- `APIService.loadAllWeeks()`: Fetches data for all 18 regular season weeks
- `ScoreboardView.displayWeek()`: Renders games for selected week
- `GameDetailView.renderGameDetail()`: Displays comprehensive game information
- `GameDetailView.renderBoxScore()`: Creates quarter-by-quarter scoring table
- `TeamScheduleView.show()`: Renders full season schedule for selected team
- `TeamScheduleView.generateTeamSchedule()`: Builds complete team game list

## Usage Instructions

### Development Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/davidfoulkejr/nfl-scoreboard.git
   cd nfl-scoreboard
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
4. **Open Browser**: Navigate to `http://localhost:3000`

### Build Commands

- **Development**: `npm run dev` - Start development server with hot reload
- **Production Build**: `npm run build` - Build optimized files to `dist/` directory
- **Preview Build**: `npm run preview` - Preview the production build locally

### Automated Deployment

This repository includes GitHub Actions workflow for automatic deployment to Azure Storage static website hosting. The workflow:

1. Installs Node.js dependencies
2. Builds the production version with Vite
3. Deploys the optimized `dist/` folder to Azure
4. Any push to the `master` branch automatically updates the live site

### Navigation

- **Week Selection**: Use Previous/Next buttons or dropdown menu
- **Current Week**: Automatically detected based on current date
- **Game Details**: Click any game card to view comprehensive information
- **Team Schedules**: Click team names/logos to view full season schedule
- **URL Sharing**: Direct links to specific weeks, games, and team schedules
- **Mobile**: Swipe-friendly interface on touch devices

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Features Used**: ES6+ Modules, CSS Grid, Flexbox, Fetch API
- **Build Target**: Modern browsers with ES6+ support (bundled and transpiled via Vite)

## Data Sources

- **ESPN API**: Official ESPN NFL API for real-time game data
- **Team Logos**: ESPN's CDN for official NFL team logos
- **Team Colors**: Local JSON file with official NFL team color schemes
- **Betting Data**: ESPN BET and other integrated sportsbooks

## Customization

### Styling

Modify `src/styles/styles.css` to customize:

- Team colors and branding
- Card layouts and spacing
- Typography and fonts
- Mobile responsive breakpoints

### Functionality

Edit the JavaScript modules in the `src/js/` directory to adjust:

- API endpoints or parameters (`apiService.js`)
- Week range (currently weeks 1-18) (`scoreboard.js`)
- Data display preferences (`gameDetail.js`, `teamSchedule.js`)
- Navigation behavior (`app.js`)
- Build configuration (`vite.config.js`)

### Team Colors

Edit `public/team-colors.json` to customize:

- Team primary and secondary colors
- Color schemes for team schedule views
- Branding consistency across the application

## Error Handling

The application includes comprehensive error handling for:

- **API Failures**: Network issues, server errors, invalid responses
- **Missing Data**: Weeks with no games, incomplete game information
- **Browser Issues**: Older browsers, disabled JavaScript
- **User Experience**: Loading states, retry mechanisms, fallback images

## Performance Features

- **Efficient Loading**: Parallel API calls for all weeks
- **Memory Management**: Smart caching of fetched data
- **Lazy Rendering**: Only renders visible week content
- **Optimized Images**: Proper logo sizing and fallback handling
- **Code Splitting**: Modular JavaScript architecture with Vite bundling
- **Asset Optimization**: Minified CSS and JavaScript in production builds
- **Fast Development**: Hot module reload for instant development feedback

## Future Enhancements

Potential improvements could include:

- Playoff week support
- Enhanced player statistics display
- Game recap integration
- Push notifications for score updates
- Favorite teams functionality with local storage
- Historical season data and archives
- Progressive Web App (PWA) capabilities
- Dark/light theme toggle

---

**Built for the 2025 NFL Season**  
_Data provided by ESPN API_
