 
import { Directive, ElementRef, OnInit, EventEmitter, HostListener, Output } from '@angular/core';
import { GestureController } from '@ionic/angular';
 
@Directive({
  selector: '[appSwipe]',
  standalone: true
})
export class SwipeDirective implements OnInit {
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();
 
  private startX: number = 0;
  private startY: number = 0;
  private minDistance = 100;
  private maxVerticalDistance = 50;
  private startTime: number = 0;
  private maxTime = 500;
 
  constructor(private el: ElementRef, private gestureCtrl: GestureController) { }
  ngOnInit() {
    const gesture = this.gestureCtrl.create({
      el: this.el.nativeElement,
      threshold: 15,
      gestureName: 'swipe',
      onStart: () => { },
      onMove: (detail) => {
 
      },
      onEnd: (detail) => {
        const deltaX = detail.deltaX;
        const time = detail.currentTime - detail.startTime;
 
        // Checking to see how fast the swipe was
        if (time <= 300 && Math.abs(deltaX) >= 60) {
          if (deltaX > 0) {
            this.swipeRight.emit();
          } else {
            this.swipeLeft.emit();
          }
        }
      }
    });
 
    gesture.enable();
  }
}