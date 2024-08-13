import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'ios', // Set the default mode to iOS
    }),
    FormsModule,
    HttpClientModule, // Add HttpClientModule here
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}