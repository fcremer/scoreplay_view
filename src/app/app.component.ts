import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface TableData {
  heading: string;
  data: { rank: number; player: string; score: number; points?: number; guest?: boolean }[];
}

interface LatestScore {
  date: string;
  pinball: string;
  player: string;
  points: number;
  rank: number | null;
}

interface PinballHighScore {
  player: string;
  points: number;
  score: number;
  rank: number;
  guest?: boolean;
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
  [key: string]: string;
}

interface PinballMap {
  [key: string]: string;
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
  latestScores: LatestScore[] = [];
  highScores: HighScore[] = [];
  players: PlayerMap = {};
  pinballs: PinballMap = {};
  standings: TableData[] = [];
  refreshTime: number = 60;
  currentHourMinute: string = '';
  progress: number = 100;
  searchQuery: string = '';
  isSearching: boolean = false;
  tables: TableData[] = [];
  filteredTables: TableData[] = [];
  scrollInterval: any;
  isLoading: boolean = true;
  freeScoreMachines: string[] = [];
  playerList: Player[] = [];
  selectedPlayer1: string = '';
  selectedPlayer2: string = '';
  commonUnplayedPinballs: string[] = [];
  matchSuggestions: { pinballName: string; matches: { player1: string; player2: string }[] }[] = [];
  progressData: { [key: string]: string } = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initializeTables();
    this.filteredTables = this.tables;
    this.startAutoScroll();
    this.fetchData();
    this.updateTime();
    this.startCountdown();
    this.loadAllData();
    this.fetchFreeScores();
    this.fetchPlayers();
    this.fetchPinballs();
  }

  initializeTables() {
    this.standings = [];
  }

  loadAllData() {
    Promise.all([this.fetchPlayers(), this.fetchPinballs()])
      .then(() => {
        return this.fetchStandings();
      })
      .then(() => {
        this.fetchLatestScores();
        this.fetchHighScores();
      })
      .then(() => {
        console.log('All data loaded successfully');
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Failed to load data:', error);
        this.isLoading = false;
      });
  }

  fetchData() {
    this.weatherData = 'Sunny, 25°C';
    this.newsData = 'Breaking News: Ionic Framework is awesome!';
    this.stockData = 'AAPL: $150.25';
  }

  fetchLatestScores() {
    this.http.get<LatestScore[]>('https://backend.aixplay.aixtraball.de/latestscores')
      .subscribe(scores => {
        if (scores) {
          this.latestScores = scores.sort((a, b) => b.points - a.points);
          console.log('Latest scores loaded:', this.latestScores);
        }
      }, error => {
        console.error('Failed to fetch latest scores', error);
      });
  }

  fetchHighScores() {
    this.http.get<HighScore[]>('https://backend.aixplay.aixtraball.de/total_highscore')
      .subscribe(highScores => {
        if (highScores) {
          this.highScores = highScores.sort((a, b) => a.rank - b.rank);
          console.log('High scores loaded:', this.highScores);

          highScores.forEach(score => {
            this.fetchPlayerProgress(score.player);
          });
        }
      }, error => {
        console.error('Failed to fetch high scores', error);
      });
  }

  fetchPlayerProgress(playerAbbreviation: string) {
    this.http.get<{ tournament_progress: string }>(`https://backend.aixplay.aixtraball.de/get_player/${playerAbbreviation}`)
      .subscribe(playerData => {
        if (playerData) {
          this.progressData[playerAbbreviation] = playerData.tournament_progress;
          console.log(`Progress for ${playerAbbreviation}:`, playerData.tournament_progress);
        }
      }, error => {
        console.error(`Failed to fetch progress for player ${playerAbbreviation}`, error);
      });
  }

  fetchPlayers(): Promise<void> {
    return this.http.get<Player[]>('https://backend.aixplay.aixtraball.de/players')
      .toPromise()
      .then(players => {
        if (players) {
          this.players = players.reduce((acc: PlayerMap, player) => {
            acc[player.abbreviation] = player.name;
            return acc;
          }, {});
          this.playerList = players;
          console.log('Players loaded:', this.players);
        }
      }, error => {
        console.error('Failed to fetch players', error);
      });
  }

  fetchPinballs(): Promise<void> {
    return this.http.get<Pinball[]>('https://backend.aixplay.aixtraball.de/pinball')
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
      return this.http.get<PinballHighScore[]>(`https://backend.aixplay.aixtraball.de/highscore/pinball/${pinballAbbreviation}`)
        .toPromise()
        .then(scores => {
          if (scores) {
            const standingsData = scores.map(score => ({
              rank: score.rank,
              player: this.formatPlayerName(this.players[score.player] || score.player),
              score: score.score,
              points: score.points,
              guest: score.guest || false
            }));
            this.standings.push({
              heading: pinballName,
              data: standingsData
            });
          }
        }, error => {
          console.error(`Failed to fetch standings for ${pinballName}`, error);
        });
    });
    return Promise.all(promises).then(() => {
      this.filteredTables = this.standings;
    });
  }

  formatNumberWithSeparators(value: number): string {
    return value.toLocaleString('en-US').replace(/,/g, '.');
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
    }, 100);
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
      now.getMinutes().toString().padStart(2, '0');
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

  resetSelections() {
    this.selectedPlayer1 = '';
    this.selectedPlayer2 = '';
    this.matchSuggestions = [];
  }

  checkMatch() {
    if (this.selectedPlayer1 && this.selectedPlayer2) {
      const endpoint = `https://backend.aixplay.aixtraball.de/matchsuggestion/${this.selectedPlayer1}/${this.selectedPlayer2}`;
      this.http.get<{ common_unplayed_machines: string[] }>(endpoint)
        .subscribe(response => {
          console.log('Match suggestion response:', response);
          // Update the list of common unplayed pinballs
          this.commonUnplayedPinballs = response.common_unplayed_machines.map(pinballAbbr =>
            this.pinballs[pinballAbbr] || pinballAbbr
          );
          this.matchSuggestions = response.common_unplayed_machines.map(pinballAbbr => ({
            pinballName: this.pinballs[pinballAbbr] || pinballAbbr,
            matches: [{ player1: this.players[this.selectedPlayer1], player2: this.players[this.selectedPlayer2] }]
          }));
          console.log('Common unplayed pinballs:', this.commonUnplayedPinballs);
        }, error => {
          console.error('Failed to fetch match suggestions', error);
        });
    }
  }

  fetchFreeScores() {
    this.http.get<string[]>('https://backend.aixplay.aixtraball.de/getfreescores')
      .subscribe(abbreviations => {
        if (abbreviations) {
          this.freeScoreMachines = abbreviations.map(abbreviation => this.pinballs[abbreviation] || abbreviation);
          console.log('Free score machines loaded:', this.freeScoreMachines);
        }
      }, error => {
        console.error('Failed to fetch free scores', error);
      });
  }
}