export const dynamic = 'force-dynamic';

import { makeItemHandlers } from '@/lib/crud';
import ErrorEntry from '@/models/ErrorEntry';

export const { GET, PUT, DELETE } = makeItemHandlers(ErrorEntry);