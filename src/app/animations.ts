import { AnimationController } from '@ionic/angular';

export function slideAnimation(animationCtrl: AnimationController) {
  const element = document.querySelector('ion-page'); // Find the page element

  if (!element) {
    console.error('Animation Error: ion-page not found');
    return null; // Prevent animation if the element isn't found
  }

  return animationCtrl.create()
    .addElement(element) // Ensures we only pass a valid element
    .duration(500)
    .fromTo('transform', 'translateX(100%)', 'translateX(0)');
}
