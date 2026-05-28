import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: any;
  constructor(private http: HttpClient) { }

  loadConfig() {
    if (this.config == null) {
      return lastValueFrom(this.http.get('/assets/app.config.json'))
        .then(data => this.config = data);
    }

    return Promise.resolve();
    
  }

  get systemURL() { return this.config.systemURL; }
}
