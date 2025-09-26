# NFL Scoreboard Website

A static website tha### File Structure

```
nfl-scoreboard/
├── index.html                    # Main SPA HTML structure
├── styles.css                    # Complete CSS with responsive design
├── staticwebapp.config.json      # Azure Static Web Apps configuration
├── js/
│   ├── app.js                   # Main application and routing controller
│   ├── apiService.js            # ESPN API data management
│   ├── scoreboard.js            # Week scoreboard view controller
│   └── gameDetail.js            # Individual game detail view controller
└── README.md                     # Complete documentation
```s NFL scoreboards by week using ESPN's API data. Built with pure HTML, CSS, and JavaScript.

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

### 📅 Week Navigation & Routing
- **Previous/Next Buttons**: Navigate chronologically through weeks
- **Week Dropdown**: Jump directly to any specific week
- **Date Ranges**: Shows the date span for each week (e.g., "Nov 12 - Nov 16")
- **Auto-Detection**: Automatically displays the current week on page load
- **URL-Based Navigation**: Shareable links for specific weeks and games
- **Hash Routing**: `/week/3` and `/week/3/game/401772812` URL structure

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
├── index.html          # Main HTML structure
├── styles.css          # All CSS styling and responsive design
├── script.js           # JavaScript application logic
└── README.md           # This documentation file
```

## Technical Implementation

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

#### Core Methods
- `NFLApp.handleRouteChange()`: Processes URL hash changes for navigation
- `APIService.loadAllWeeks()`: Fetches data for all 18 regular season weeks
- `ScoreboardView.displayWeek()`: Renders games for selected week
- `GameDetailView.renderGameDetail()`: Displays comprehensive game information
- `GameDetailView.renderBoxScore()`: Creates quarter-by-quarter scoring table

## Usage Instructions

### Running Locally
1. **Download Files**: Save all files to a local directory
2. **Start Server**: Run a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```
3. **Open Browser**: Navigate to `http://localhost:8000`

### Navigation
- **Week Selection**: Use Previous/Next buttons or dropdown menu
- **Current Week**: Automatically detected based on current date
- **Game Details**: Each card shows comprehensive game information
- **Mobile**: Swipe-friendly interface on touch devices

## Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Features Used**: ES6+ JavaScript, CSS Grid, Flexbox, Fetch API

## Data Sources
- **ESPN API**: Official ESPN NFL API for real-time game data
- **Team Logos**: ESPN's CDN for official NFL team logos
- **Betting Data**: ESPN BET and other integrated sportsbooks

## Customization

### Styling
Modify `styles.css` to customize:
- Team colors and branding
- Card layouts and spacing
- Typography and fonts
- Mobile responsive breakpoints

### Functionality
Edit `script.js` to adjust:
- API endpoints or parameters
- Week range (currently weeks 1-18)
- Data display preferences
- Navigation behavior

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

## Future Enhancements
Potential improvements could include:
- Playoff week support
- Player statistics display
- Game recap integration
- Push notifications for score updates
- Favorite teams functionality
- Historical season data

---

**Built for the 2025 NFL Season**  
*Data provided by ESPN API*