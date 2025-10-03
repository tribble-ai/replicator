/**
 * Data transformers for exceedra API responses
 *
 * Converts exceedra's API format into Tribble-compatible structured data
 */

import type { TransformContext, TransformResult } from '@tribble/sdk-integrations';

/**
 * exceedra Document API response format
 */
export interface exceedraDocument {
  id: string;
  title: string;
  content: string;
  document_type: 'sds' | 'product_spec' | 'label' | 'regulatory' | 'other';
  product_id?: string;
  version: string;
  language: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  metadata: {
    regulatory_region?: string;
    cas_number?: string;
    product_name?: string;
    manufacturer?: string;
    [key: string]: any;
  };
}

/**
 * exceedra Product API response format
 */
export interface exceedraProduct {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  manufacturer: {
    id: string;
    name: string;
  };
  specifications: {
    ingredients?: Array<{ name: string; percentage: number; cas_number?: string }>;
    physical_properties?: Record<string, any>;
    packaging?: Record<string, any>;
  };
  regulatory_info: {
    regions: string[];
    certifications: string[];
    warnings?: string[];
  };
  created_at: string;
  updated_at: string;
}

/**
 * exceedra Retailer API response format
 */
export interface exceedraRetailer {
  id: string;
  name: string;
  type: 'distributor' | 'retailer' | 'wholesaler';
  contact: {
    email?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  regions: string[];
  products: string[]; // Product IDs
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

/**
 * Transform exceedra documents to Tribble format
 */
export async function transformDocuments(
  documents: exceedraDocument[],
  context: TransformContext
): Promise<TransformResult[]> {
  return documents.map((doc) => {
    // Convert document to rich JSON format that Tribble can process
    const enrichedContent = {
      title: doc.title,
      content: doc.content,
      documentType: doc.document_type,
      productId: doc.product_id,
      version: doc.version,
      language: doc.language,
      status: doc.status,
      metadata: doc.metadata,
    };

    return {
      data: enrichedContent,
      metadata: {
        exceedra_id: doc.id,
        exceedra_type: 'document',
        document_type: doc.document_type,
        title: doc.title,
        version: doc.version,
        language: doc.language,
        status: doc.status,
        product_id: doc.product_id,
        regulatory_region: doc.metadata.regulatory_region,
        cas_number: doc.metadata.cas_number,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        source: context.source,
        sync_timestamp: context.receivedAt.toISOString(),
      },
      filename: `exceedra-document-${doc.id}-${doc.version}.json`,
      contentType: 'application/json',
    };
  });
}

/**
 * Transform exceedra products to Tribble format
 */
export async function transformProducts(
  products: exceedraProduct[],
  context: TransformContext
): Promise<TransformResult[]> {
  return products.map((product) => {
    // Create a comprehensive product document
    const enrichedContent = {
      productId: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      category: product.category,
      manufacturer: product.manufacturer,
      specifications: product.specifications,
      regulatoryInfo: product.regulatory_info,

      // Create searchable text summary
      summary: `
Product: ${product.name}
SKU: ${product.sku}
Category: ${product.category}
Manufacturer: ${product.manufacturer.name}
Description: ${product.description}

Regulatory Regions: ${product.regulatory_info.regions.join(', ')}
Certifications: ${product.regulatory_info.certifications.join(', ')}
${product.regulatory_info.warnings ? `Warnings: ${product.regulatory_info.warnings.join(', ')}` : ''}

${product.specifications.ingredients ? `
Ingredients:
${product.specifications.ingredients.map((ing) => `  - ${ing.name} (${ing.percentage}%)${ing.cas_number ? ` [CAS: ${ing.cas_number}]` : ''}`).join('\n')}
` : ''}
`.trim(),
    };

    return {
      data: enrichedContent,
      metadata: {
        exceedra_id: product.id,
        exceedra_type: 'product',
        name: product.name,
        sku: product.sku,
        category: product.category,
        manufacturer_id: product.manufacturer.id,
        manufacturer_name: product.manufacturer.name,
        regulatory_regions: product.regulatory_info.regions,
        certifications: product.regulatory_info.certifications,
        created_at: product.created_at,
        updated_at: product.updated_at,
        source: context.source,
        sync_timestamp: context.receivedAt.toISOString(),
      },
      filename: `exceedra-product-${product.id}.json`,
      contentType: 'application/json',
    };
  });
}

/**
 * Transform exceedra retailers to Tribble format
 */
export async function transformRetailers(
  retailers: exceedraRetailer[],
  context: TransformContext
): Promise<TransformResult[]> {
  return retailers.map((retailer) => {
    // Create a comprehensive retailer document
    const enrichedContent = {
      retailerId: retailer.id,
      name: retailer.name,
      type: retailer.type,
      contact: retailer.contact,
      regions: retailer.regions,
      productIds: retailer.products,
      status: retailer.status,

      // Create searchable text summary
      summary: `
Retailer: ${retailer.name}
Type: ${retailer.type}
Status: ${retailer.status}
Regions: ${retailer.regions.join(', ')}

${retailer.contact.email ? `Email: ${retailer.contact.email}` : ''}
${retailer.contact.phone ? `Phone: ${retailer.contact.phone}` : ''}
${retailer.contact.address ? `
Address:
${retailer.contact.address.street}
${retailer.contact.address.city}, ${retailer.contact.address.state} ${retailer.contact.address.zip}
${retailer.contact.address.country}
` : ''}

Products: ${retailer.products.length} associated products
`.trim(),
    };

    return {
      data: enrichedContent,
      metadata: {
        exceedra_id: retailer.id,
        exceedra_type: 'retailer',
        name: retailer.name,
        type: retailer.type,
        status: retailer.status,
        regions: retailer.regions,
        product_count: retailer.products.length,
        email: retailer.contact.email,
        phone: retailer.contact.phone,
        created_at: retailer.created_at,
        updated_at: retailer.updated_at,
        source: context.source,
        sync_timestamp: context.receivedAt.toISOString(),
      },
      filename: `exceedra-retailer-${retailer.id}.json`,
      contentType: 'application/json',
    };
  });
}

/**
 * Generic transformer that routes to specific transformers based on data type
 */
export async function transformexceedraData(
  data: any[],
  dataType: 'documents' | 'products' | 'retailers',
  context: TransformContext
): Promise<TransformResult[]> {
  switch (dataType) {
    case 'documents':
      return transformDocuments(data as exceedraDocument[], context);
    case 'products':
      return transformProducts(data as exceedraProduct[], context);
    case 'retailers':
      return transformRetailers(data as exceedraRetailer[], context);
    default:
      throw new Error(`Unknown data type: ${dataType}`);
  }
}
