import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  weatherData: string = 'Loading weather...';
  newsData: string = 'Loading news...';
  stockData: string = 'Loading stocks...';
  refreshTime: number = 60; // Refresh every 60 seconds
  currentHourMinute: string = '';
  progress: number = 100; // Percentage progress of the circle

  ngOnInit() {
    this.fetchData();
    this.startAutoRefresh();
    this.updateTime();
  }

  fetchData() {
    // Simulate fetching data
    this.weatherData = 'Sunny, 25°C';
    this.newsData = 'Breaking News: Ionic Framework is awesome!';
    this.stockData = 'AAPL: $150.25';

    // Reset refresh timer
    this.refreshTime = 60;
    this.progress = 100;
  }

  startAutoRefresh() {
    setInterval(() => {
      this.refreshTime -= 1;
      this.progress = (this.refreshTime / 60) * 100; // Calculate progress

      if (this.refreshTime <= 0) {
        this.fetchData();
      }
    }, 1000); // Update every second
  }

  updateTime() {
    const now = new Date();
    this.currentHourMinute = now.getHours().toString().padStart(2, '0') + ':' +
                             now.getMinutes().toString().padStart(2, '0');
    setInterval(() => {
      const now = new Date();
      this.currentHourMinute = now.getHours().toString().padStart(2, '0') + ':' +
                               now.getMinutes().toString().padStart(2, '0');
    }, 60000); // Update time every minute
  }
}