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

export const evtSort = (a: string, b: string) => {
  const DIGITS = '0123456789';
  const normalize = (s: string) => s.replace('Mile', '1609').replace('MILE', '1609');
  const firstNumericWord = (s: string) => s.split(' ').find((w) => DIGITS.includes(w[0])) ?? s.slice(1);
  const gender = (s: string) => s.match(/(Men|Women)/)?.[0] ?? s[0];
  a = normalize(a);
  b = normalize(b);
  if (gender(a) !== gender(b)) return a.localeCompare(b);
  return Number.parseInt(firstNumericWord(a)) - Number.parseInt(firstNumericWord(b));
};
