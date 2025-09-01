export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  unit?: string;
  category: string;
  barcode: string;
  sku?: string;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  storeId: string;
  stock: number;
}
