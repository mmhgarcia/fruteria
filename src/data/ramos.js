import { defaultProducts } from './products'

export const CATALOGO_RAMOS = [
  {
    id: 'fruteria',
    name: 'Frutería',
    icon: '🍎',
    categories: [
      { id: 'frutas', name: 'Frutas', icon: '🍊', order: 1 },
      { id: 'verduras', name: 'Verduras', icon: '🥬', order: 2 },
      { id: 'ofertas', name: 'Ofertas', icon: '🏷️', order: 3 },
    ],
    products: defaultProducts,
  },
  {
    id: 'carniceria',
    name: 'Carnicería',
    icon: '🥩',
    categories: [
      { id: 'res', name: 'Carnes de Res', icon: '🥩', order: 1 },
      { id: 'cerdo', name: 'Carnes de Cerdo', icon: '🥓', order: 2 },
      { id: 'pollo', name: 'Pollos', icon: '🍗', order: 3 },
    ],
    products: [],
  },
  {
    id: 'charcuteria',
    name: 'Charcutería',
    icon: '🧀',
    categories: [
      { id: 'embutidos', name: 'Embutidos', icon: '🌭', order: 1 },
      { id: 'quesos', name: 'Quesos', icon: '🧀', order: 2 },
    ],
    products: [],
  },
  {
    id: 'panaderia',
    name: 'Panadería',
    icon: '🥖',
    categories: [
      { id: 'panes', name: 'Panes', icon: '🥖', order: 1 },
      { id: 'dulces', name: 'Dulces', icon: '🍩', order: 2 },
      { id: 'reposteria', name: 'Repostería', icon: '🎂', order: 3 },
    ],
    products: [],
  },
  {
    id: 'abarrotes',
    name: 'Bodega / Abarrotes',
    icon: '🏪',
    categories: [
      { id: 'comidas', name: 'Comidas', icon: '🍚', order: 1 },
      { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 2 },
      { id: 'limpieza', name: 'Limpieza', icon: '🧴', order: 3 },
    ],
    products: [],
  },
  {
    id: 'licoreria',
    name: 'Licorería',
    icon: '🍾',
    categories: [
      { id: 'cervezas', name: 'Cervezas', icon: '🍺', order: 1 },
      { id: 'vinos', name: 'Vinos', icon: '🍷', order: 2 },
      { id: 'destilados', name: 'Destilados', icon: '🥃', order: 3 },
    ],
    products: [],
  },
]

export function getRamoPorId(ramoId) {
  return CATALOGO_RAMOS.find((r) => r.id === ramoId) || null
}
