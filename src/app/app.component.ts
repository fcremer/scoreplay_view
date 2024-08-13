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
  players: PlayerMap = {}; // Map player abbreviations to names
  pinballs: PinballMap = {}; // Map pinball abbreviations to long names
  refreshTime: number = 60; // Refresh every 60 seconds
  currentHourMinute: string = '';
  progress: number = 100; // Percentage progress of the circle

  searchQuery: string = '';
  isSearching: boolean = false;
  tables: TableData[] = [];
  filteredTables: TableData[] = [];
  scrollInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initializeTables();
    this.filteredTables = this.tables;
    this.startAutoScroll();
    this.fetchData();
    this.updateTime();
    this.startCountdown();
    this.fetchLatestScores(); // Fetch latest scores on initialization
    this.fetchPlayers(); // Fetch player data
    this.fetchPinballs(); // Fetch pinball data
    this.fetchHighScores(); // Fetch high scores data
  }

  initializeTables() {
    for (let i = 1; i <= 40; i++) {
      this.tables.push({
        heading: `Table ${i}`,
        data: Array.from({ length: 10 }, (_, index) => ({
          rank: index + 1,
          player: `Player ${index + 1}`,
          score: Math.floor(Math.random() * 100),
        })),
      });
    }
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
        // Sort scores by points in descending order
        this.latestScores = scores.sort((a, b) => b.points - a.points);
      }, error => {
        console.error('Failed to fetch latest scores', error);
      });
  }

  fetchHighScores() {
    this.http.get<HighScore[]>('https://liga.aixtraball.de/total_highscore')
      .subscribe(highScores => {
        // Sort high scores by rank in descending order
        this.highScores = highScores.sort((a, b) => a.rank - b.rank);
      }, error => {
        console.error('Failed to fetch high scores', error);
      });
  }

  fetchPlayers() {
    this.http.get<Player[]>('https://liga.aixtraball.de/players')
      .subscribe(players => {
        this.players = players.reduce((acc: PlayerMap, player) => {
          acc[player.abbreviation] = player.name;
          return acc;
        }, {});
      }, error => {
        console.error('Failed to fetch players', error);
      });
  }

  fetchPinballs() {
    this.http.get<Pinball[]>('https://liga.aixtraball.de/pinball')
      .subscribe(pinballs => {
        this.pinballs = pinballs.reduce((acc: PinballMap, pinball) => {
          acc[pinball.abbreviation] = pinball.long_name;
          return acc;
        }, {});
      }, error => {
        console.error('Failed to fetch pinballs', error);
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
    this.filteredTables = this.tables.filter((table) =>
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
        this.fetchPlayers(); // Refresh players
        this.fetchPinballs(); // Refresh pinballs
        this.fetchHighScores(); // Refresh high scores
      }
    }, 1000); // Update every second
  }
}