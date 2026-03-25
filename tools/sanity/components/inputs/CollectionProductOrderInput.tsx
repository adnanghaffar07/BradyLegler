import React, { useEffect, useState, useCallback } from 'react';
import { useFormValue, useClient } from 'sanity';
import { ArrayOfObjectsInputProps, PatchEvent, set, insert } from 'sanity';
import { Card, Heading, Text, Stack, Button, Spinner, Inline } from '@sanity/ui';

interface Product {
  _id: string;
  title: string;
}

/**
 * Custom input for productOrder field that auto-fetches products from selected collection
 */
const CollectionProductOrderInput = React.forwardRef<
  HTMLDivElement,
  ArrayOfObjectsInputProps
>((props, ref) => {
  const { value = [], onChange, elementProps } = props;
  const client = useClient({ apiVersion: '2025-02-10' });
  const collectionRef = useFormValue(['collection']) as any;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch products when collection changes
  useEffect(() => {
    const loadProducts = async () => {
      if (!collectionRef?._ref) {
        setProducts([]);
        setError(null);
        setHasLoaded(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get all product references
        const query = `*[_type == "product" && store.status != "archived"] {
          _id,
          store {
            title
          }
        } | sort(store.title asc)`;

        const results = await client.fetch(query);
        
        const mapped: Product[] = (Array.isArray(results) ? results : []).map((p: any) => ({
          _id: p._id,
          title: p.store?.title || p._id
        }));

        setProducts(mapped);
        setHasLoaded(true);
        
        // Auto-populate if empty
        if ((!value || value.length === 0) && mapped.length > 0) {
          const refs = mapped.map(p => ({
            _type: 'reference',
            _ref: p._id,
            _key: p._id
          }));
          onChange(PatchEvent.from(set(refs)));
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setProducts([]);
        setHasLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [collectionRef?._ref, client, value, onChange]);

  // Show message if no collection selected
  if (!collectionRef?._ref) {
    return (
      <Card tone="caution" padding={3} {...elementProps}>
        <Stack space={2}>
          <Text weight="semibold" size={1}>Product Order</Text>
          <Text muted size={0}>Select a collection above to populate products</Text>
        </Stack>
      </Card>
    );
  }

  // Show loading state
  if (loading && !hasLoaded) {
    return (
      <Card padding={3} {...elementProps}>
        <Inline space={2}>
          <Spinner />
          <Text size={0}>Loading products...</Text>
        </Inline>
      </Card>
    );
  }

  // Show error
  if (error) {
    return (
      <Card tone="critical" padding={3} {...elementProps}>
        <Stack space={2}>
          <Text weight="semibold" size={0}>Error</Text>
          <Text size={0}>{error}</Text>
        </Stack>
      </Card>
    );
  }

  // Show status
  if (products.length === 0) {
    return (
      <Card tone="caution" padding={3} {...elementProps}>
        <Text size={0} muted>No products found</Text>
      </Card>
    );
  }

  // Render the default array input
  return (
    <div {...elementProps}>
      <Stack space={3}>
        <Card padding={2} tone="positive" style={{ fontSize: '0.875rem' }}>
          <Text size={0}>{products.length} products loaded. Drag to reorder.</Text>
        </Card>
        {props.renderDefault(props)}
      </Stack>
    </div>
  );
});

CollectionProductOrderInput.displayName = 'CollectionProductOrderInput';

export default CollectionProductOrderInput;
