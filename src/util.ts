import { codeToDiscipline } from './const';

export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

export const codeToEvt = (evt: string) => {
  return (evt[0] === 'M' ? "Men's " : "Women's ") + codeToDiscipline[evt.slice(1)];
};
