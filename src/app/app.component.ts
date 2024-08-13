import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface TableData {
  heading: string;
  data: { rank: number; player: string; score: number }[];
}

interface LatestScore {
  date: string;
  pinball: string;
  player: string;
  points: number;
  rank: number | null; // Rank can be null
}

interface PinballHighScore {
  player: string;
  points: number; // Represents the rank as points
  score: number;  // Represents the score
}

interface HighScore {
  player: string;
  rank: number;
  total_points: number;
}

interface Player {
  abbreviation: string;
  name: string;
}

interface Pinball {
  abbreviation: string;
  long_name: string;
  room: string;
}

interface PlayerMap {
  [key: string]: string; // Index signature for player mapping
}

interface PinballMap {
  [key: string]: string; // Index signature for pinball mapping
}

interface MatchSuggestion {
  pinball: string;
  player1: string;
  player2: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  weatherData: string = 'Loading weather...';
  newsData: string = 'Loading news...';
  stockData: string = 'Loading stocks...';
  latestScores: LatestScore[] = []; // Store the latest scores
  highScores: HighScore[] = []; // Store the total high scores
  matchSuggestions: MatchSuggestion[] = []; // Store match suggestions
  players: PlayerMap = {}; // Map player abbreviations to names
  pinballs: PinballMap = {}; // Map pinball abbreviations to long names
  standings: TableData[] = []; // Store standings data
  refreshTime: number = 60; // Refresh every 60 seconds
  currentHourMinute: string = '';
  progress: number = 100; // Percentage progress of the circle

  searchQuery: string = '';
  isSearching: boolean = false;
  tables: TableData[] = [];
  filteredTables: TableData[] = [];
  scrollInterval: any;

  isLoading: boolean = true; // Loading state

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initializeTables();
    this.filteredTables = this.tables;
    this.startAutoScroll();
    this.fetchData();
    this.updateTime();
    this.startCountdown();
    this.loadAllData(); // Load all data and wait until it's ready
  }
  initializeTables() {
    this.standings = []; // Clear previous standings
  }

  loadAllData() {
    // Load players and pinballs first
    Promise.all([this.fetchPlayers(), this.fetchPinballs()])
      .then(() => {
        // Then fetch standings and match suggestions once players and pinballs are loaded
        return Promise.all([this.fetchStandings(), this.fetchMatchSuggestions()]);
      })
      .then(() => {
        this.fetchLatestScores(); // Ensure latest scores are fetched
        this.fetchHighScores(); // Ensure high scores are fetched
      })
      .then(() => {
        console.log('All data loaded successfully');
        this.isLoading = false; // Set loading to false once all data is fetched
      })
      .catch(error => {
        console.error('Failed to load data:', error);
        this.isLoading = false; // Ensure loading is false even on error
      });
  }

  fetchData() {
    // Simulate fetching data
    this.weatherData = 'Sunny, 25°C';
    this.newsData = 'Breaking News: Ionic Framework is awesome!';
    this.stockData = 'AAPL: $150.25';
  }
  fetchLatestScores() {
    this.http.get<LatestScore[]>('https://liga.aixtraball.de/latestscores')
      .subscribe(scores => {
        if (scores) {
          // Sort scores by points in descending order
          this.latestScores = scores.sort((a, b) => b.points - a.points);
          console.log('Latest scores loaded:', this.latestScores);
        }
      }, error => {
        console.error('Failed to fetch latest scores', error);
      });
  }

  fetchHighScores() {
    this.http.get<HighScore[]>('https://liga.aixtraball.de/total_highscore')
      .subscribe(highScores => {
        if (highScores) {
          // Sort high scores by rank in descending order
          this.highScores = highScores.sort((a, b) => a.rank - b.rank);
          console.log('High scores loaded:', this.highScores);
        }
      }, error => {
        console.error('Failed to fetch high scores', error);
      });
  }
  fetchPlayers(): Promise<void> {
    return this.http.get<Player[]>('https://liga.aixtraball.de/players')
      .toPromise()
      .then(players => {
        if (players) {
          this.players = players.reduce((acc: PlayerMap, player) => {
            acc[player.abbreviation] = player.name;
            return acc;
          }, {});
          console.log('Players loaded:', this.players);
        }
      }, error => {
        console.error('Failed to fetch players', error);
      });
  }

  fetchPinballs(): Promise<void> {
    return this.http.get<Pinball[]>('https://liga.aixtraball.de/pinball')
      .toPromise()
      .then(pinballs => {
        if (pinballs) {
          this.pinballs = pinballs.reduce((acc: PinballMap, pinball) => {
            acc[pinball.abbreviation] = pinball.long_name;
            return acc;
          }, {});
          console.log('Pinballs loaded:', this.pinballs);
        }
      }, error => {
        console.error('Failed to fetch pinballs', error);
      });
  }

  fetchStandings(): Promise<void> {
    const promises = Object.keys(this.pinballs).map(pinballAbbreviation => {
      const pinballName = this.pinballs[pinballAbbreviation];
      return this.http.get<PinballHighScore[]>(`https://liga.aixtraball.de/highscore/pinball/${pinballAbbreviation}`)
        .toPromise()
        .then(scores => {
          if (scores) {
            const standingsData = scores.map((score, index) => ({
              rank: index + 1, // Rank based on order in array
              player: this.formatPlayerName(this.players[score.player] || score.player),
              score: score.score
            }));
            this.standings.push({
              heading: pinballName,
              data: standingsData
            });
            console.log(`Standings for ${pinballName} loaded:`, standingsData);
          }
        }, error => {
          console.error(`Failed to fetch standings for ${pinballName}`, error);
        });
    });
    return Promise.all(promises).then(() => {
      this.filteredTables = this.standings; // Ensure filtered tables are up-to-date
    });
  }
  fetchMatchSuggestions(): Promise<void> {
    return this.http.get<MatchSuggestion[]>('https://liga.aixtraball.de/matchsuggestion')
      .toPromise()
      .then(suggestions => {
        if (suggestions) {
          this.matchSuggestions = suggestions;
          console.log('Match suggestions loaded:', this.matchSuggestions);
        }
      }, error => {
        console.error('Failed to fetch match suggestions', error);
      });
  }

  formatNumberWithSeparators(value: number): string {
    return value.toLocaleString('en-US').replace(/,/g, '.'); // Convert commas to dots for thousand separators
  }

  formatPlayerName(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
    }
    return name;
  }
  startAutoScroll() {
    this.scrollInterval = setInterval(() => {
      if (!this.isSearching) {
        const container = document.querySelector('.table-container');
        if (container) {
          container.scrollTop += 1;
          if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
            container.scrollTop = 0;
          }
        }
      }
    }, 100); // Adjust scrolling speed
  }

  onSearch(event: any) {
    this.isSearching = !!this.searchQuery.trim();
    this.filteredTables = this.standings.filter((table) =>
      table.heading.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    if (this.isSearching) {
      clearInterval(this.scrollInterval);
    } else {
      this.startAutoScroll();
    }
  }

  updateTime() {
    const now = new Date();
    this.currentHourMinute = now
      .getHours()
      .toString()
      .padStart(2, '0') +
      ':' +
      now
        .getMinutes()
        .toString()
        .padStart(2, '0');
    setInterval(() => {
      const now = new Date();
      this.currentHourMinute =
        now.getHours().toString().padStart(2, '0') +
        ':' +
        now.getMinutes().toString().padStart(2, '0');
    }, 60000); // Update time every minute
  }

  startCountdown() {
    setInterval(() => {
      if (this.refreshTime > 0) {
        this.refreshTime -= 1;
        this.progress = (this.refreshTime / 60) * 100;
      } else {
        this.refreshTime = 60; // Reset countdown
        this.fetchData(); // Refresh data
        this.fetchLatestScores(); // Refresh latest scores
        this.loadAllData(); // Reload all data
      }
    }, 1000); // Update every second
  }
}