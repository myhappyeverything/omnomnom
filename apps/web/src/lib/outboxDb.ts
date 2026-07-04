// Raw IndexedDB wrapper for the offline mutation queue — deliberately
// dependency-free (no `idb`) since the access pattern is a single small
// object store with add/getAll/delete, not worth a new dependency for.

const DB_NAME = 'omnomnom-outbox'
const DB_VERSION = 1
const STORE_NAME = 'mutations'

export interface OutboxEntry {
  id?: number
  resource: 'water' | 'weight'
  operation: 'create' | 'delete'
  /** For a create: the clientId embedded in the request body. For a delete: the server record id being removed. */
  clientId: string
  method: 'POST' | 'DELETE'
  path: string
  body: unknown
  /** Human-readable, shown in the offline banner / toasts. */
  description: string
  createdAt: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open outbox database'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const request = run(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Outbox transaction failed'))
    })
  } finally {
    db.close()
  }
}

export async function addOutboxEntry(entry: Omit<OutboxEntry, 'id'>): Promise<number> {
  return withStore('readwrite', (store) => store.add(entry) as IDBRequest<number>)
}

export async function getAllOutboxEntries(): Promise<OutboxEntry[]> {
  const entries = await withStore(
    'readonly',
    (store) => store.getAll() as IDBRequest<OutboxEntry[]>,
  )
  return entries.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
}

export async function deleteOutboxEntry(id: number): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}
