import React, { useState } from 'react';
import SidePanel, { SIDE_PANEL_Z_INDEX } from '@/components/SidePanel';
import Button from '@/components/Button';
import Text from '@/components/Text';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import { getFilteredSizeGuideTables } from './utils';
import styles from './styles.module.scss';

type Rows = {
  cells: string[];
};

type SizeGuideProps = {
  sanitySizeGuide: ISizeGuideDocument;
  collections?: {
    edges: {
      node: {
        title: string;
        id: string;
        handle: string;
      };
    }[];
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const SizeGuide = (props: SizeGuideProps) => {
  const { sanitySizeGuide, collections, isOpen, onOpenChange } = props;
  const [internalOpen, setInternalOpen] = useState(false);
  const tables = (Array.isArray(sanitySizeGuide?.tables) ? sanitySizeGuide.tables : []) as Parameters<
    typeof getFilteredSizeGuideTables
  >[0];

  const productCollectionIds = collections?.edges.map(edge => edge.node.id) || [];
  const filteredTables = getFilteredSizeGuideTables(tables, productCollectionIds);
  const hasSizeGuide = filteredTables.length > 0;
  const isControlled = onOpenChange !== undefined;
  const showSizeGuide = isControlled ? (isOpen ?? false) : internalOpen;

  const setShowSizeGuide = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setInternalOpen(open);
    }
  };

  if (!hasSizeGuide) return null;

  return (
    <>
      <Button onClick={() => setShowSizeGuide(true)} text="Size Guide" variant="normal-sm" />
      <SidePanel
        title="Size Guide"
        show={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        zIndex={SIDE_PANEL_Z_INDEX.elevated}
      >
        <SidePanel.Body>
          <div className={styles.container}>
            {filteredTables?.map((item, index) => {
              const { title, Table, _key } = item;
              const rows = Table.rows;
              return (
                <div key={`${_key}_${index}`} className={styles.guide}>
                  <Text text={title} size="b3" />
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {rows[0]?.cells.map((header, index: number) => (
                          <th key={`header-${index}`} className={styles.headerCell}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(1).map((row: { cells: string[] }, rowIndex: number) => (
                        <tr key={`row-${rowIndex}`}>
                          {row.cells.map((cell: string, cellIndex: number) => (
                            <td key={`cell-${rowIndex}-${cellIndex}`} className={styles.cell}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </SidePanel.Body>
      </SidePanel>
    </>
  );
};

export default SizeGuide;
