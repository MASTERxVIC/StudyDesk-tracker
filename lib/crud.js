import { NextResponse } from 'next/server';
import dbConnect from './db';

// Generic CRUD route handlers for a Mongoose model.
// Usage in app/api/<resource>/route.js:
//   export const { GET, POST } = makeCollectionHandlers(MyModel);
// Usage in app/api/<resource>/[id]/route.js:
//   export const { GET, PUT, DELETE } = makeItemHandlers(MyModel);

export function makeCollectionHandlers(Model, sort = { createdAt: -1 }) {
  return {
    GET: async () => {
      await dbConnect();
      const items = await Model.find({}).sort(sort).lean();
      return NextResponse.json(items);
    },
    POST: async (req) => {
      await dbConnect();
      const body = await req.json();
      const item = await Model.create(body);
      return NextResponse.json(item, { status: 201 });
    },
  };
}

export function makeItemHandlers(Model) {
  return {
    GET: async (_req, { params }) => {
      await dbConnect();
      const item = await Model.findById(params.id).lean();
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    },
    PUT: async (req, { params }) => {
      await dbConnect();
      const body = await req.json();
      const item = await Model.findByIdAndUpdate(params.id, body, {
        new: true,
        runValidators: true,
      }).lean();
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    },
    DELETE: async (_req, { params }) => {
      await dbConnect();
      const item = await Model.findByIdAndDelete(params.id).lean();
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true });
    },
  };
}
