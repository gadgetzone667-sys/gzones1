export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  brand: string;
  description: string;
  stock: number;
  featured?: boolean;
  specs?: Record<string, string>;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: string;
  features: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  productId?: string;
}

export interface PCComponent {
  id: string;
  category: string;
  name: string;
  price: number;
  brand: string;
  specs: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export const categories: Category[] = [
  { id: "processors", name: "Processors", icon: "Cpu" },
  { id: "graphics-cards", name: "Graphics Cards", icon: "Monitor" },
  { id: "motherboards", name: "Motherboards", icon: "CircuitBoard" },
  { id: "memory", name: "Memory (RAM)", icon: "MemoryStick" },
  { id: "storage", name: "Storage", icon: "HardDrive" },
  { id: "peripherals", name: "Peripherals", icon: "Keyboard" },
  { id: "cameras", name: "Cameras", icon: "Camera" },
];

// All dummy / sample data has been completely removed.
// Products, Services, Reviews, and Components are 100% dynamic from MongoDB.
export const products: Product[] = [];
export const testimonials: Review[] = [];
export const pcComponents: Record<string, PCComponent[]> = {};
export const services: Service[] = [];
