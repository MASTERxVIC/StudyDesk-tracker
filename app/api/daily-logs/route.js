export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { makeCollectionHandlers } from '@/lib/crud';
import dbConnect from '@/lib/db';
import DailyLog from '@/models/DailyLog';

const { GET } = makeCollectionHandlers(DailyLog, { date: -1 });
export { GET };

// One log per day: agar us date ka log pehle se hai to naya banane ki jagah
// usi ko update kar do (duplicate entries nahi banengi)
export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const item = await DailyLog.findOneAndUpdate(
    { date: body.date },
    body,
    { new: true, upsert: true, runValidators: true }
  ).lean();
  return NextResponse.json(item, { status: 201 });
}
