import { Component, CUSTOM_ELEMENTS_SCHEMA, Inject, OnInit, Renderer2 } from '@angular/core';
import { AuthenticationService, ConfigService } from '../services';
import { Session, UnitListing, IncidentInformation } from '../models';
import { CommonModule, DatePipe, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface UnitInformation {
  personnel: string | null,
  role: string | null,
  status: string | null,
  type: string | null,
  unit: string | null,
  update_ts: Date | null,
  incident: IncidentInformation | null
}

interface IncResponse {
  errorMessage: Object;
  success: boolean;
  incidents: IncidentInformation[];
}

interface POICategory {
  cat_id: number,
  name: string,
  color: string,
  bgcolor: string,
  hexbg: string
}

interface Polygon {
  id: number,
  type: string, //LINE, POLYGON
  category: string,
  name: string,
  coordinates: { lat: number, lng: number }[]
}

interface VehicleDetails {
  vehicle_id: string,
  unit_id: string | null,
  lat: number,
  lng: number,
  ts: Date
}

interface Window {
  removePoly: (id: number) => void;
  removeLine: (id: number) => void;
  createLine: (m: any) => void;
  createPoly: (m: any) => void;
}

interface POI {
  poi_id: number,
  poi_name: string,
  poi_shortname: string,
  poi_lat: number,
  poi_lng: number,
  poi_category: string,
  fc: string,
  bc: string
}

@Component({
  templateUrl: 'map.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./map.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapComponent implements OnInit {
  private refreshToken: ReturnType<typeof setInterval> | undefined = undefined;
  private deb: boolean = false;
  public clockString: string = '00:00:00';

  public incidents: IncidentInformation[] = [];
  public vehicles: VehicleDetails[] = [];

  public polygons: Polygon[] = [];
  public categories: POICategory[] = [];
  public pois: POI[] = [];

  constructor(private config: ConfigService, public authService: AuthenticationService, private http: HttpClient, public datepipe: DatePipe, private router: Router, private renderer: Renderer2, @Inject(DOCUMENT) private document: Document)
  {
    config.loadConfig().then(() => {
      this.loadData();
    });
    this.refreshToken = setInterval(() => this.loadData(), 1000);
    
  }

  ngOnInit() {

    const script = this.renderer.createElement('script');
    script.src = 'assets/map/CallMap.js';

    script.onload = () => {

      const gmapAPI = this.renderer.createElement('script');
      gmapAPI.src =
        `https://maps.googleapis.com/maps/api/js?key=${this.googleLink}&callback=initMap&v=weekly&libraries=marker,maps,core`;

      this.renderer.appendChild(this.document.body, gmapAPI);
    };

    this.renderer.appendChild(this.document.body, script);
  }

  trackLocation(index: number, item: any) {
    return item.vehicle_id;
  }

  trackIncident(index: number, item: any) {
    return item.incident_id;
  }

  trackPOI(index: number, item: any) {
    return item.poi_id;
  }

  trupleToHex(truple: string) {
    const [r, g, b] = truple.split(',').map(Number)


    return '#' + [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  loadData() {

    const now = Date();
    const formatted = this.datepipe.transform(now, 'HH:mm:ss');
    this.clockString = formatted || "00:00:00";

    if (this.deb) return;
    this.deb = true;

    this.http.post<IncResponse>(`https://${this.config.systemURL.trim()}/API/Incidents/Incidents/get/active`, this.authService.getSession()).subscribe(
      (response) => {
        this.incidents = response.incidents;
      },
      (error) => {
        console.log(error);
        if (error.status == 401)
          this.authService.logout();
      }
    );

    this.http.post<VehicleDetails[]>(`https://${this.config.systemURL.trim()}/API/Units/Location/get`, this.authService.getSession()).subscribe(
      (response) => {

        this.deb = false;
        this.vehicles = response;
      },
      (error) => {
        console.log(error);
        this.deb = false;
        if (error.status == 401)
          this.authService.logout();
      }
    );

    this.http.post<POICategory[]>(`https://${this.config.systemURL.trim()}/API/Map/Map/get/cat`, this.authService.getSession()).subscribe(
      (response) => {
        this.categories = response.map(cat => ({
          ...cat,
        }));


        this.http.post<Polygon[]>(`https://${this.config.systemURL.trim()}/API/Map/Map/get/poly`, this.authService.getSession()).subscribe(
          (response) => {

            const removeLine = this.polygons.filter(p => p.type == "LINE" && response.findIndex((np) => np.id == p.id) == -1);
            removeLine.forEach(l => (window as unknown as Window).removeLine(l.id));

            const addLine = response.filter(p => p.type == "LINE" && this.polygons.findIndex((np) => np.id == p.id) == -1);
            addLine.forEach(l => (window as unknown as Window).createLine({
              id: l.id,
              c2: l.coordinates as { lat: number, lng: number }[],
              color: this.categories.find(c => c.name == l.category)?.hexbg ?? "#000000"
            }));

            const removePoly = this.polygons.filter(p => p.type == "POLYGON" && response.findIndex((np) => np.id == p.id) == -1);
            removePoly.forEach(l => (window as unknown as Window).removePoly(l.id));

            const addPoly = response.filter(p => p.type == "POLYGON" && this.polygons.findIndex((np) => np.id == p.id) == -1);
            addPoly.forEach(l => (window as unknown as Window).createPoly({
              id: l.id,
              c2: l.coordinates as { lat: number, lng: number }[],
              color: this.categories.find(c => c.name == l.category)?.hexbg ?? "#000000"
            }));

            this.polygons = response;
            this.deb = false;
          },
          (error) => {
            console.log(error);
            this.deb = false;
            if (error.status == 401)
              this.authService.logout();
          }
        );


        this.http.post<POI[]>(`https://${this.config.systemURL.trim()}/API/Map/Map/get/poi`, this.authService.getSession()).subscribe(
          (response) => {
            this.pois = response.map(poi => ({
              ...poi,
              fc: this.categories.find(c => c.name == poi.poi_category)?.color ?? "0,0,0",
              bc: this.categories.find(c => c.name == poi.poi_category)?.bgcolor ?? "0,0,0",
            }));
          },
          (error) => {
            console.log(error);
            if (error.status == 401)
              this.authService.logout();
          }
        );

      },
      (error) => {
        console.log(error);
        this.deb = false;
        if (error.status == 401)
          this.authService.logout();
      }
    );


   
  }

  get incidentLocations() {
    return this.incidents.filter(i => i.lat != null && i.log != null);
  }

  ngOnDestroy() {
    clearInterval(this.refreshToken);
  }


  logout() {
    this.authService.logout();
  }

  get sysname(): string{
    return this.authService.getSession()?.sysName ?? '???'
  }

  get sysLat(): number {
    const lat = this.authService.getSession()?.sysLat;
    return lat ?? 0;
  }

  get sysLng(): number {
    const lng = this.authService.getSession()?.sysLon;
    return lng ?? 0;
  }

  get googleLink(): string {
    const lng = this.authService.getSession()?.googleLink;
    return lng ?? "";
  }

  get sysZoom(): number {
    const lng = this.authService.getSession()?.sysZoom;
    return lng ?? 0;
  }



}
