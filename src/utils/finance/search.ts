// Tiny parser for amount comparison operators in finance search
// Supports: >100, >=100, <50, <=200, =100, !=100, with optional spaces and commas
// Returns { operator, value } if matched, otherwise null

export type AmountOperator = '>' | '>=' | '<' | '<=' | '=' | '!=';

export interface AmountComparison {
  operator: AmountOperator;
  value: number;
}

const amountPattern = /^\s*([<>]=?|!?=)\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*$/;

export function parseAmountComparison(input: string | undefined | null): AmountComparison | null {
  if (!input) return null;
  const match = input.match(amountPattern);
  if (!match) return null;
  const op = match[1] as AmountOperator;
  const numStr = match[2].replace(/,/g, '');
  const val = Number(numStr);
  if (Number.isNaN(val)) return null;
  return { operator: op, value: val };
}

export function compareAmount(amount: number, comp: AmountComparison): boolean {
  switch (comp.operator) {
    case '>':
      return amount > comp.value;
    case '>=':
      return amount >= comp.value;
    case '<':
      return amount < comp.value;
    case '<=':
      return amount <= comp.value;
    case '=':
      return amount === comp.value;
    case '!=':
      return amount !== comp.value;
    default:
      return false;
  }
}

export function applyAmountComparison(query: any, comparison?: AmountComparison | null) {
  if (!comparison || comparison.value === undefined) return query;
  
  switch (comparison.operator) {
    case '>':
      return query.gt('amount', comparison.value);
    case '>=':
      return query.gte('amount', comparison.value);
    case '<':
      return query.lt('amount', comparison.value);
    case '<=':
      return query.lte('amount', comparison.value);
    case '=':
      return query.eq('amount', comparison.value);
    case '!=':
      return query.neq('amount', comparison.value);
    default:
      return query;
  }
}