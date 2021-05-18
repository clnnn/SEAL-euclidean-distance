import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EncryptionService } from './encryption.service';
import { DistanceResponse } from './model/distance-response';
import { Point } from './model/point';
import { PointsRequest } from './model/points-request';

@Injectable({
  providedIn: 'root',
})
export class DistanceFacade {
  private pointsSubject = new Subject<[Point, Point]>();
  public computedDistance$ = this.pointsSubject.pipe(
    switchMap(([p1, p2]: [Point, Point]) =>
      this.http.post<DistanceResponse>('/cloud', this.createRequest(p1, p2))
    ),
    // Square root is not a supported homomorphic operation
    map((response) =>
      Math.sqrt(this.encryptionService.decryptNumber(response.encValue))
    )
  );

  constructor(
    private encryptionService: EncryptionService,
    private http: HttpClient
  ) {}

  public compute(p1: Point, p2: Point): void {
    this.pointsSubject.next([p1, p2]);
  }

  public createRequest(p1: Point, p2: Point): PointsRequest {
    return {
      encX1: this.encryptionService.encryptNumber(p1.x),
      encY1: this.encryptionService.encryptNumber(p1.y),
      encX2: this.encryptionService.encryptNumber(p2.x),
      encY2: this.encryptionService.encryptNumber(p2.y),
    };
  }
}
