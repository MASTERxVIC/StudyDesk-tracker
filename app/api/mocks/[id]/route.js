export const dynamic = 'force-dynamic';

import { makeItemHandlers } from '@/lib/crud';
import MockTest from '@/models/MockTest';

export const { GET, PUT, DELETE } = makeItemHandlers(MockTest);