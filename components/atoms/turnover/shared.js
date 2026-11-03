export const SCOPE_LABELS = {xarici: 'Xarici', yerli: 'Yerli'};
export const DIRECTION_LABELS = {idxal: 'İdxal', ixrac: 'İxrac'};
export const CURRENCIES = ['AZN', 'USD', 'EUR'];

export const fmtNumber = (v, max = 3) => (v === null || v === undefined || v === ''
    ? '—'
    : Number(v).toLocaleString('az-AZ', {maximumFractionDigits: max}));

export const fmtQuantity = (r) => (r.quantity === null || r.quantity === undefined
    ? '—'
    : `${fmtNumber(r.quantity)}${r.unit ? ` ${r.unit}` : ''}`);

export const fmtAmount = (r) => (r.amount === null || r.amount === undefined || r.amount === ''
    ? '—'
    : `${fmtNumber(r.amount, 2)} ${r.currency || ''}`.trim());

export const fmtDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('az-AZ');
};