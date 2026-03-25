import React, { useEffect, useState, useCallback } from 'react';
import { useClient } from 'sanity';
import { ArrayOfObjectsInputProps, PatchEvent, set } from 'sanity';
import {
  Card,
  Text,
  Stack,
  Button,
  Spinner,
  Inline,
  Box,
  TextInput,
  Checkbox,
  Dialog
} from '@sanity/ui';

interface Product {
  _id: string;
  title: string;
  selected?: boolean;
}

const ProductsMultiSelectInput = React.forwardRef<
  HTMLDivElement,
  ArrayOfObjectsInputProps
>((props, ref) => {
  const { value = [], onChange, elementProps } = props;
  const client = useClient({ apiVersion: '2025-02-10' });
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all products on mount
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = `*[_type == "product" && store.status != "archived"] | order(store.title asc) {
          _id,
          store {
            title
          }
        }`;

        const results = await client.fetch(query);

        const mappedProducts: Product[] = (Array.isArray(results) ? results : []).map((p: any) => ({
          _id: p._id,
          title: p.store?.title || p._id,
          selected: false
        }));

        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [client]);

  // Filter products based on search query
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const filtered = products.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products]);

  // Toggle product selection
  const handleToggleProduct = useCallback((productId: string) => {
    setFilteredProducts(prev =>
      prev.map(p =>
        p._id === productId ? { ...p, selected: !p.selected } : p
      )
    );
    setProducts(prev =>
      prev.map(p =>
        p._id === productId ? { ...p, selected: !p.selected } : p
      )
    );
  }, []);

  // Add selected products to the array
  const handleAddSelected = useCallback(() => {
    const selectedProducts = products.filter(p => p.selected);

    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    // Get existing product IDs
    const existingIds = new Set((value || []).map((v: any) => v._ref));

    // Create references only for new products
    const newReferences = selectedProducts
      .filter(p => !existingIds.has(p._id))
      .map(p => ({
        _type: 'reference',
        _ref: p._id,
        _key: p._id
      }));

    if (newReferences.length === 0) {
      setError('All selected products are already added');
      return;
    }

    // Combine with existing products
    const combined = [...(value || []), ...newReferences];
    onChange(PatchEvent.from(set(combined)));

    // Reset
    setProducts(prev => prev.map(p => ({ ...p, selected: false })));
    setFilteredProducts(prev => prev.map(p => ({ ...p, selected: false })));
    setSearchQuery('');
    setShowDialog(false);
    setError(null);
  }, [products, value, onChange]);

  // Select all filtered products
  const handleSelectAll = useCallback(() => {
    const allSelected = filteredProducts.every(p => p.selected);

    setFilteredProducts(prev =>
      prev.map(p => ({ ...p, selected: !allSelected }))
    );

    setProducts(prev =>
      prev.map(p => {
        const isInFiltered = filteredProducts.find(f => f._id === p._id);
        return isInFiltered ? { ...p, selected: !allSelected } : p;
      })
    );
  }, [filteredProducts]);

  const selectedCount = products.filter(p => p.selected).length;
  const currentCount = value?.length || 0;

  if (loading && products.length === 0) {
    return (
      <Card padding={3} {...elementProps}>
        <Inline space={2}>
          <Spinner />
          <Text size={0}>Loading products...</Text>
        </Inline>
      </Card>
    );
  }

  if (error && products.length === 0) {
    return (
      <Card tone="critical" padding={3} {...elementProps}>
        <Stack space={2}>
          <Text weight="semibold" size={0}>Error</Text>
          <Text size={0}>{error}</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <div {...elementProps}>
      <Stack space={3}>
        <Card padding={3} tone="primary">
          <Stack space={2}>
            <Inline space={2}>
              <Button
                onClick={() => setShowDialog(true)}
                tone="positive"
                text={`Add Products (${selectedCount} selected)`}
              />
              <Text size={0} muted>
                {currentCount} product{currentCount !== 1 ? 's' : ''} added
              </Text>
            </Inline>
          </Stack>
        </Card>

        {/* Dialog for multi-select */}
        {showDialog && (
          <Dialog
            header="Select Products"
            id="products-dialog"
            onClose={() => setShowDialog(false)}
            zOffset={1000}
          >
            <Box padding={4}>
              <Stack space={3}>
                {/* Search input */}
                <TextInput
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.currentTarget.value)}
                />

                {/* Select all checkbox */}
                {filteredProducts.length > 0 && (
                  <Card padding={2} tone="default">
                    <Inline space={2}>
                      <Checkbox
                        checked={filteredProducts.every(p => p.selected)}
                        onChange={handleSelectAll}
                      />
                      <Text size={0} weight="semibold">
                        Select all {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                      </Text>
                    </Inline>
                  </Card>
                )}

                {/* Products list */}
                <Stack space={2} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredProducts.length === 0 ? (
                    <Text size={0} muted>
                      No products found
                    </Text>
                  ) : (
                    filteredProducts.map(product => (
                      <Card
                        key={product._id}
                        padding={2}
                        tone={product.selected ? 'positive' : 'default'}
                        onClick={() => handleToggleProduct(product._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Inline space={2}>
                          <Checkbox checked={product.selected} readOnly />
                          <Text size={0}>{product.title}</Text>
                        </Inline>
                      </Card>
                    ))
                  )}
                </Stack>

                {/* Action buttons */}
                <Inline space={2}>
                  <Button
                    onClick={handleAddSelected}
                    tone="positive"
                    text={`Add ${selectedCount} Product${selectedCount !== 1 ? 's' : ''}`}
                    disabled={selectedCount === 0}
                  />
                  <Button
                    onClick={() => setShowDialog(false)}
                    tone="default"
                    text="Cancel"
                  />
                </Inline>

                {error && (
                  <Card tone="critical" padding={2}>
                    <Text size={0}>{error}</Text>
                  </Card>
                )}
              </Stack>
            </Box>
          </Dialog>
        )}

        {/* Render default array input for managing added products */}
        <Card padding={2} tone="default">
          <Text size={0} muted>
            Drag to reorder the {currentCount} added product{currentCount !== 1 ? 's' : ''}
          </Text>
        </Card>
        {props.renderDefault(props)}
      </Stack>
    </div>
  );
});

ProductsMultiSelectInput.displayName = 'ProductsMultiSelectInput';

export default ProductsMultiSelectInput;
