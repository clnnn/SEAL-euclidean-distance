import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DistanceFacade } from './distance.facade';
import { Point } from './model/point';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  public distanceForm = this.formBuilder.group({
    x1: ['', Validators.required],
    y1: ['', Validators.required],
    x2: ['', Validators.required],
    y2: ['', Validators.required],
  });
  private isProcessingSubject = new Subject<boolean>();
  public isProcessing$ = this.isProcessingSubject.asObservable();

  private subscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private distanceFacade: DistanceFacade,
    private snackBar: MatSnackBar
  ) {}

  public ngOnInit(): void {
    // todo documentation (prerequisites, Explaination, Diagram, UI demo GIF, enc. configuration, payload format, size problems)
    this.subscription = this.distanceFacade.computedDistance$
      .pipe(finalize(() => this.isProcessingSubject.next(false)))
      .subscribe(
        (distance) => {
          this.isProcessingSubject.next(false);
          this.snackBar.open(
            `The distance between two points is ${distance}`,
            'Close',
            {
              duration: 2500,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          );
        },
        () => {
          this.snackBar.open('Server crash', undefined, {
            duration: 1500,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        }
      );
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public onCompute(): void {
    this.isProcessingSubject.next(true);
    const formValue = this.distanceForm.value;
    const p1: Point = {
      x: formValue.x1,
      y: formValue.y1,
    };
    const p2: Point = {
      x: formValue.x2,
      y: formValue.y2,
    };
    this.distanceFacade.compute(p1, p2);
  }

  public onReset(): void {
    this.distanceForm.reset();
  }
}
