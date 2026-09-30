/**
 * Utility to smoothly scroll a focused element and its attached floating dropdown card
 * into full view within its scrollable parent container, ensuring it sits above
 * the mobile virtual keyboard or bottom of the viewport with safe margins.
 */
export const scrollElementIntoViewAboveKeyboard = (
  element: HTMLElement | null,
  extraBottomMargin = 28
) => {
  if (!element) return;

  // Delay slightly to allow virtual keyboard animation and DOM expansion
  setTimeout(() => {
    // Find nearest scrollable parent container
    let scrollParent: HTMLElement | null = element.parentElement;
    while (scrollParent && scrollParent !== document.body) {
      const overflowY = window.getComputedStyle(scrollParent).overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        scrollParent.scrollHeight > scrollParent.clientHeight
      ) {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }

    if (!scrollParent) return;

    const elemRect = element.getBoundingClientRect();
    const parentRect = scrollParent.getBoundingClientRect();

    // Calculate how far the bottom of the expanded menu is past the visible bottom of the scroll parent
    const visibleBottom = parentRect.top + scrollParent.clientHeight;
    const distancePastBottom = elemRect.bottom - visibleBottom;

    if (distancePastBottom > -extraBottomMargin) {
      scrollParent.scrollBy({
        top: distancePastBottom + extraBottomMargin,
        behavior: 'smooth',
      });
    }
  }, 120);
};
