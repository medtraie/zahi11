import { SystemState } from '../types';
import initialSeedData from '../data/initialData.json';

const STORAGE_KEY = 'zahi_ice_stock_v1_state';

// In-memory cache for ultra-fast, smooth reactivity
let memoryCache: SystemState | null = null;
const listeners = new Set<(state: SystemState) => void>();

/**
 * Initialize state from localStorage or initialSeedData fallback
 */
export function getStoredState(): SystemState {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed: SystemState = JSON.parse(raw);
      // Validate basic structure
      if (parsed && parsed.products && parsed.depots) {
        memoryCache = parsed;
        return memoryCache;
      }
    }
  } catch (e) {
    console.warn('[LocalStorageService] Failed to read from localStorage:', e);
  }

  // Fallback to complete seed data exported from db.json
  const seedClone = JSON.parse(JSON.stringify(initialSeedData)) as SystemState;
  memoryCache = seedClone;
  saveStoredState(seedClone);
  return memoryCache;
}

/**
 * Persist updated state to localStorage with debounced safety
 */
export function saveStoredState(state: SystemState): void {
  memoryCache = state;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.error('[LocalStorageService] Failed to save state to localStorage:', e);
  }

  // Notify active listeners
  listeners.forEach(cb => cb(state));
}

/**
 * Subscribe to state changes (for ultra fluid multi-tab sync)
 */
export function subscribeToState(callback: (state: SystemState) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Reset state to factory default seed data
 */
export function resetStoredState(): SystemState {
  const seedClone = JSON.parse(JSON.stringify(initialSeedData)) as SystemState;
  saveStoredState(seedClone);
  return seedClone;
}

/**
 * Helper to add an audit log to state
 */
function recordAudit(state: SystemState, action: string, details: string, user?: any) {
  if (!Array.isArray(state.auditLogs)) {
    state.auditLogs = [];
  }
  state.auditLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    userId: user?.id || 'user-admin',
    userName: user?.name || 'Administrateur',
    role: user?.role || 'Super Admin',
    action,
    details
  });
}

/**
 * Client-Side API Dispatcher
 * Allows the React App to run seamlessly on Vercel without requiring a Node.js backend.
 */
export async function executeClientApi(endpoint: string, options?: RequestInit): Promise<any> {
  const method = (options?.method || 'GET').toUpperCase();
  const body = options?.body ? JSON.parse(options.body as string) : {};
  const state = getStoredState();

  // 1. GET /api/state
  if (endpoint === '/api/state' && method === 'GET') {
    return state;
  }

  // 2. POST /api/reset
  if (endpoint === '/api/reset' && method === 'POST') {
    const newState = resetStoredState();
    return { success: true, state: newState };
  }

  // 3. POST /api/production
  if (endpoint === '/api/production' && method === 'POST') {
    const { productId, quantity, tempRegistered, batchNumber, newProduct, user } = body;
    let targetProduct = state.products.find(p => p.id === productId);

    if (newProduct) {
      targetProduct = newProduct;
      state.products.push(newProduct);
    }

    if (quantity > 0) {
      const newBatch = {
        id: `batch-${Date.now()}`,
        batchNumber: batchNumber || `LOT-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`,
        productId: targetProduct?.id || productId,
        productName: targetProduct?.name || 'Produit',
        quantity,
        quantityDamaged: 0,
        tempRegistered: tempRegistered || -18,
        createdAt: new Date().toISOString()
      };
      state.batches.unshift(newBatch);

      const pos = state.stockPositions.find(p => p.locationName === 'Magasin Usine' && p.productId === targetProduct?.id);
      if (pos) {
        pos.quantity += quantity;
      } else {
        state.stockPositions.push({
          productId: targetProduct?.id || productId,
          productName: targetProduct?.name || 'Produit',
          quantity,
          locationName: 'Magasin Usine'
        });
      }

      recordAudit(state, "Production Lot", `Production de ${quantity} cartons de ${targetProduct?.name}`, user);
    }
    saveStoredState(state);
    return { success: true, state };
  }

  // 4. POST /api/products/:id
  if (endpoint.startsWith('/api/products/') && method === 'POST') {
    const prodId = endpoint.replace('/api/products/', '');
    const idx = state.products.findIndex(p => p.id === prodId);
    if (idx >= 0) {
      state.products[idx] = {
        ...state.products[idx],
        ...body
      };
      recordAudit(state, "Modification Produit", `Mise à jour produit : ${state.products[idx].name}`, body.user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // 5. POST /api/losses
  if (endpoint === '/api/losses' && method === 'POST') {
    const { location, productId, quantity, reason, notes, user } = body;
    const prod = state.products.find(p => p.id === productId);
    
    // Reduce from location
    if (location.startsWith('Dépôt ')) {
      const depotName = location.replace('Dépôt ', '').trim();
      const depot = state.depots[depotName];
      if (depot) {
        const item = depot.stock.find(s => s.productId === productId);
        if (item) item.quantity = Math.max(0, item.quantity - quantity);
        depot.adjustments.unshift({
          id: `adj-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          productId,
          productName: prod?.name || 'Produit',
          type: 'damaged',
          quantity,
          notes: `${reason} - ${notes || ''}`
        });
      }
    } else {
      const pos = state.stockPositions.find(p => p.locationName === location && p.productId === productId);
      if (pos) {
        pos.quantity = Math.max(0, pos.quantity - quantity);
      }
    }

    recordAudit(state, "Déclaration Perte", `Perte de ${quantity} cartons au ${location} (${reason})`, user);
    saveStoredState(state);
    return { success: true, state };
  }

  // 6. POST /api/transfers
  if (endpoint === '/api/transfers' && method === 'POST') {
    const { source, destination, items, carrierName, notes, user } = body;
    const newTr = {
      id: `tr-${Date.now()}`,
      trackingNumber: `TR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      source,
      destination,
      items: items || [],
      status: 'In Transit' as const,
      sentAt: new Date().toISOString(),
      receivedAt: null,
      carrierName: carrierName || 'Transporteur Interne',
      scannedCartons: 0,
      lossCount: 0,
      temperatureAlert: false,
      notes: notes || ''
    };

    // Deduct stock from source
    (items || []).forEach((it: any) => {
      const pos = state.stockPositions.find(p => p.locationName === source && p.productId === it.productId);
      if (pos) {
        pos.quantity = Math.max(0, pos.quantity - it.quantity);
      }
    });

    state.transfers.unshift(newTr);
    recordAudit(state, "Transfert Expédié", `Transfert ${newTr.trackingNumber} de ${source} vers ${destination}`, user);
    saveStoredState(state);
    return { success: true, state };
  }

  // 7. POST /api/transfers/:id/status
  if (endpoint.startsWith('/api/transfers/') && endpoint.endsWith('/status') && method === 'POST') {
    const trId = endpoint.replace('/api/transfers/', '').replace('/status', '');
    const tr = state.transfers.find(t => t.id === trId);
    if (tr) {
      const { status, scannedCartons, lossCount, tempAlert, notes, user } = body;
      tr.status = status;
      tr.scannedCartons = scannedCartons || 0;
      tr.lossCount = lossCount || 0;
      tr.temperatureAlert = !!tempAlert;
      if (notes) tr.notes = notes;
      if (status === 'Received') {
        tr.receivedAt = new Date().toISOString();

        // Add items to destination
        tr.items.forEach(it => {
          if (tr.destination.startsWith('Dépôt ')) {
            const depName = tr.destination.replace('Dépôt ', '').trim();
            const depot = state.depots[depName];
            if (depot) {
              const item = depot.stock.find(s => s.productId === it.productId);
              if (item) {
                item.quantity += it.quantity;
              } else {
                depot.stock.push({ productId: it.productId, productName: it.productName, quantity: it.quantity });
              }
            }
          } else {
            const pos = state.stockPositions.find(p => p.locationName === tr.destination && p.productId === it.productId);
            if (pos) {
              pos.quantity += it.quantity;
            } else {
              state.stockPositions.push({ productId: it.productId, productName: it.productName, quantity: it.quantity, locationName: tr.destination });
            }
          }
        });
      }
      recordAudit(state, "Transfert Réceptionné", `Transfert ${tr.trackingNumber} reçu à ${tr.destination}`, user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // 8. POST /api/depots
  if (endpoint === '/api/depots' && method === 'POST') {
    const { name, user } = body;
    const cleanName = (name || '').trim();
    if (!state.depots[cleanName]) {
      state.depots[cleanName] = {
        name: cleanName,
        trucksCount: 0,
        stock: state.products.map(p => ({ productId: p.id, productName: p.name, quantity: 100, startingStock: 100 })),
        returns: [],
        adjustments: []
      };
      recordAudit(state, "Création Dépôt", `Nouveau dépôt créé : ${cleanName}`, user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // 9. POST /api/depots/:depotName/adjustments
  if (endpoint.includes('/adjustments') && method === 'POST') {
    const parts = endpoint.split('/');
    const depotName = decodeURIComponent(parts[3]);
    const depot = state.depots[depotName];
    if (depot) {
      const { productId, type, quantity, notes, user } = body;
      const prod = state.products.find(p => p.id === productId);
      const st = depot.stock.find(s => s.productId === productId);
      if (st) {
        if (type === 'reception' || type === 'correction') st.quantity += quantity;
        else st.quantity = Math.max(0, st.quantity - quantity);
      }
      depot.adjustments.unshift({
        id: `adj-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        productId,
        productName: prod?.name || 'Produit',
        type,
        quantity,
        notes: notes || ''
      });
      recordAudit(state, "Ajustement Dépôt", `Ajustement ${type} au dépôt ${depotName}`, user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // 10. POST /api/depots/:depotName/starting-stock
  if (endpoint.includes('/starting-stock') && method === 'POST') {
    const parts = endpoint.split('/');
    const depotName = decodeURIComponent(parts[3]);
    const depot = state.depots[depotName];
    if (depot) {
      const { productId, startingStock, quantity, user } = body;
      const st = depot.stock.find(s => s.productId === productId);
      if (st) {
        st.startingStock = startingStock;
        st.quantity = quantity;
      }
      recordAudit(state, "Stock Initial Dépôt", `Stock initial modifié au dépôt ${depotName}`, user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // 11. POST /api/trucks/:truckId/load
  if (endpoint.includes('/load') && method === 'POST') {
    const parts = endpoint.split('/');
    const truckId = parts[3];
    const truck = state.trucks.find(t => t.id === truckId);
    if (truck) {
      const { items, tournee, user } = body;
      truck.tournee = tournee || truck.tournee;
      const depot = state.depots[truck.depotName];

      (items || []).forEach((it: any) => {
        if (depot) {
          const ds = depot.stock.find(s => s.productId === it.productId);
          if (ds) ds.quantity = Math.max(0, ds.quantity - it.quantity);
        }
        const ts = truck.stock.find(s => s.productId === it.productId);
        if (ts) {
          ts.loaded += it.quantity;
        } else {
          truck.stock.push({ productId: it.productId, productName: it.productName, loaded: it.quantity, delivered: 0, returned: 0, lost: 0 });
        }
      });

      recordAudit(state, "Chargement Camion", `Chargement du camion ${truckId}`, user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // 12. POST /api/trucks/:truckId/delivery
  if (endpoint.includes('/delivery') && method === 'POST') {
    const parts = endpoint.split('/');
    const truckId = parts[3];
    const truck = state.trucks.find(t => t.id === truckId);
    if (truck) {
      const { clientName, items, signature, gps, paymentMethod, user } = body;
      (items || []).forEach((it: any) => {
        const ts = truck.stock.find(s => s.productId === it.productId);
        if (ts) ts.delivered += it.quantity;
      });

      truck.deliveries.unshift({
        id: `del-${Date.now()}`,
        clientName,
        city: truck.depotName,
        items,
        status: 'Delivered',
        deliveredAt: new Date().toISOString(),
        signature,
        gps,
        paymentMethod
      });

      recordAudit(state, "Livraison Client", `Livraison à ${clientName} par le camion ${truckId}`, user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // 13. POST /api/trucks/:truckId/return
  if (endpoint.includes('/return') && method === 'POST') {
    const parts = endpoint.split('/');
    const truckId = parts[3];
    const truck = state.trucks.find(t => t.id === truckId);
    if (truck) {
      const { returns, losses, user } = body;
      const depot = state.depots[truck.depotName];

      (returns || []).forEach((r: any) => {
        const ts = truck.stock.find(s => s.productId === r.productId);
        if (ts) ts.returned += r.quantity;
        if (depot) {
          const ds = depot.stock.find(s => s.productId === r.productId);
          if (ds) ds.quantity += r.quantity;
        }
      });

      (losses || []).forEach((l: any) => {
        const ts = truck.stock.find(s => s.productId === l.productId);
        if (ts) ts.lost += l.quantity;
      });

      recordAudit(state, "Clôture Tournée", `Clôture de tournée pour le camion ${truckId}`, user);
      saveStoredState(state);
      return { success: true, state };
    }
  }

  // Fallback default save for unknown POST
  saveStoredState(state);
  return { success: true, state };
}
