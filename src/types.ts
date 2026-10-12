/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'Super Admin'
  | 'Responsable Usine'
  | 'Responsable MICZ'
  | 'Responsable Zone Logistique'
  | 'Responsable Dépôt'
  | 'Chauffeur'
  | 'Comptable'
  | 'Responsable Commercial';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  depot?: string; // Nom du dépôt associé pour Responsable Dépôt ou Chauffeur
}

export interface Product {
  id: string;
  name: string;
  category: string; // Cornet, Bâtonnet, Gobelet, Bac, Sandwich
  barcode: string;
  image: string; // Description de l'icône / couleur
  createdAt: string;
  expiryDays: number;
  unitPriceCost: number; // Prix de revient
  unitPriceSell: number; // Prix de vente
  tempRequired?: number; // Température requise (ex: -18°C)
  cartonsPerPalette?: number; // Nombre de cartons par palette (كم من كرتونة في باليت واحدة)
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  quantity: number; // Cartons produits
  quantityDamaged: number;
  quantityExpired: number;
  productionDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'damaged';
  tempRegistered: number; // Température enregistrée
}

export interface StockPosition {
  id: string;
  productId: string;
  productName: string;
  location: string; // 'Magasin Usine' | 'Magasin MICZ' | 'Magasin Zone Logistique' | 'Dépôt Casablanca' etc.
  quantity: number; // cartons restants
}

export interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Transfer {
  id: string;
  trackingNumber: string;
  source: string;
  destination: string;
  items: TransferItem[];
  status: 'Pending' | 'In Transit' | 'Received' | 'Discrepancy';
  sentAt: string;
  receivedAt: string | null;
  carrierName: string;
  scannedCartons: number;
  lossCount: number;
  temperatureAlert: boolean;
  notes: string;
}

export interface DepotConfig {
  name: string;
  trucksCount: number;
}

export interface DepotStock {
  productId: string;
  productName: string;
  quantity: number;
  startingStock?: number;
}

export interface DepotReturn {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
}

export interface DepotAdjustment {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'damaged' | 'lost' | 'reception' | 'correction';
  quantity: number;
  notes: string;
}

export interface DepotData {
  name: string;
  trucksCount: number;
  stock: DepotStock[];
  returns: DepotReturn[];
  adjustments: DepotAdjustment[];
}

export interface TruckStockItem {
  productId: string;
  productName: string;
  loaded: number;
  delivered: number;
  returned: number;
  lost: number;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Delivery {
  id: string;
  clientName: string;
  city: string;
  items: DeliveryItem[];
  status: 'Pending' | 'Delivered' | 'Returned' | 'Failed';
  deliveredAt: string | null;
  signature: string | null; // Base64 signature
  gps: { lat: number; lng: number } | null;
  paymentMethod: 'Cash' | 'Credit' | 'Cheque';
}

export interface TruckData {
  id: string;
  driverName: string;
  depotName: string;
  tournee: string;
  stock: TruckStockItem[];
  deliveries: Delivery[];
  syncPending: boolean;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details: string;
}

export interface DeliveryNoteItem {
  productName: string;
  pcsPerCarton: number;
  quantity: number; // Quantité de cartons
  pricePerCarton: number;
  montant: number;
}

export interface DeliveryNote {
  id: string;
  noteNumber: string;
  clientName: string;
  clientCode: string;
  date: string;
  congNumber: string;
  congType: 'AP' | 'AG' | 'AS';
  sourceStockLocation: string;
  items: DeliveryNoteItem[];
  totalAmount: number;
  discount: number;
  netPayable: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SupplyRequestItem {
  ref: string;
  articleName: string;
  qtyOrdered: number;
  qtyDelivered: number;
}

export interface SupplyRequest {
  id: string;
  requestNumber: string;
  date: string;
  agency: string;
  chefSecteur: string;
  magasinier: string;
  vendeur: string;
  items: SupplyRequestItem[];
  totalGlobalDhs?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BonAvoirItem {
  productName: string;
  qtePcsPreset: number;
  cartonsQty: number;
  prixCartons: number;
  cartonsMontant: number;
  piecesQty: number;
  prixPieces: number;
  piecesMontant: number;
  monGlo: number;
}

export interface BonAvoir {
  id: string;
  number: string;
  date: string;
  clientCodeLeft: string;
  clientCodeRight: string;
  congType: 'AP' | 'AG' | 'A' | '';
  congNumber: string;
  items: BonAvoirItem[];
  montantAvoirDirhams: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BonEncaissementItem {
  date: string;
  designation: string;
  ref: string;
  montant: number;
}

export interface BonEncaissement {
  id: string;
  number: string;
  vendeur: string;
  date: string;
  items: BonEncaissementItem[];
  totalRecu: number;
  observation: string;
  visaCaissier: boolean;
  visaVendeur: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface BonChangeItem {
  productName: string;
  qtePcsPreset: number;
  cartonsQty: number;
  prixCartons: number;
  cartonsMontant: number;
  piecesQty: number;
  prixPieces: number;
  piecesMontant: number;
  monGlo: number;
}

export interface BonChange {
  id: string;
  number: string;
  date: string;
  clientCodeLeft: string;
  clientCodeRight: string;
  congType: 'AP' | 'AG' | 'AS' | '';
  congNumber: string;
  items: BonChangeItem[];
  montantChangeDirhams: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SystemState {
  products: Product[];
  batches: ProductionBatch[];
  stockPositions: StockPosition[];
  transfers: Transfer[];
  depots: Record<string, DepotData>;
  trucks: TruckData[];
  auditLogs: AuditLog[];
  deliveryNotes?: DeliveryNote[];
  supplyRequests?: SupplyRequest[];
  bonAvoirs?: BonAvoir[];
  bonEncaissements?: BonEncaissement[];
  bonChanges?: BonChange[];
}
