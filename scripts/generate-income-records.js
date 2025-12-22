import { randomUUID } from 'crypto';
import fs from 'fs';

const संगठन = {
  organization_id: '6bede681-52b5-4616-969b-02d303d84f53',
  branch_id: '57d31ccd-a28f-462d-ae11-39315bf350f9',
  created_by: '5717b8ef-94e5-49cf-9569-41783ac9cc8d'
};

const PAYMENT_METHODS = [
  'cash',
  'cheque',
  'check',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'mobile_payment',
  'online',
  'other'
];

const CATEGORIES = [
  'Offering',
  'Tithe',
  'Donation',
  'Thanksgiving',
  'Missions',
  'Building Fund',
  'Special Offering'
];

const SOURCES = ['church', 'member', 'tag_item', 'group', 'other'];
const INCOME_TYPE = 'general_income';

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randAmount() {
  return (Math.floor(Math.random() * 20) + 1) * 50;
}

function randBool() {
  return Math.random() > 0.5;
}

function randDate() {
  const start = new Date('2025-01-01');
  const end = new Date('2025-12-31');
  return new Date(start.getTime() + Math.random() * (end - start))
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '+00');
}

const header = [
  'id',
  'organization_id',
  'branch_id',
  'amount',
  'description',
  'notes',
  'date',
  'created_by',
  'updated_at',
  'created_at',
  'income_type',
  'category',
  'occasion_name',
  'attendance_occasion_id',
  'attendance_session_id',
  'source_type',
  'member_id',
  'group_id',
  'tag_item_id',
  'payment_method',
  'receipt_number',
  'is_deleted',
  'envelope_number',
  'receipt_issued',
  'source',
  'tax_deductible',
  'check_number'
].join(',');

const rows = [header];

for (let i = 1; i <= 50; i++) {
  const category = rand(CATEGORIES);
  const date = randDate();

  rows.push([
    randomUUID(),
    संगठन.organization_id,
    संगठन.branch_id,
    randAmount().toFixed(2),
    category,
    '',
    date,
    संगठन.created_by,
    date,
    date,
    INCOME_TYPE,
    category,
    '',
    '',
    '',
    rand(SOURCES),
    '',
    '',
    '',
    rand(PAYMENT_METHODS),
    `RCPT-${1000 + i}`,
    false,
    '',
    randBool(),
    'church',
    randBool(),
    ''
  ].join(','));
}

fs.writeFileSync('dist/income_seed.csv', rows.join('\n'));

console.log('✅ income_seed.csv generated with 50 valid records');
