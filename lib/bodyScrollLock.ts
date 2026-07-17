let lockCount = 0;
let savedScrollY = 0;

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') {
    return;
  }

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, savedScrollY);
  }
}
