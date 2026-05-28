import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  constructor() { }

  set(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  getLocal(key: string): any {
    const data = window.localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    } else {
      return null;
    }
  }
}
