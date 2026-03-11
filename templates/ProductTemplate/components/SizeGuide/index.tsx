import React, { useState } from 'react';
import SidePanel from '@/components/SidePanel';
import Button from '@/components/Button';
import Text from '@/components/Text';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
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
};

const SizeGuide = (props: SizeGuideProps) => {
  const { sanitySizeGuide, collections } = props;
  const [showSizeGuide, toggleSizeGuide] = useState(false);
  const tables = sanitySizeGuide?.tables || [];

  const productCollectionIds = collections?.edges.map(edge => edge.node.id) || [];

  const filteredTables = tables.filter(table => {
    const collectionIds = (table.collections || []).map(collection => collection.store.gid);
    return collectionIds.some(id => productCollectionIds.includes(id));
  });

  const hasSizeGuide = filteredTables.length > 0;

  if (!hasSizeGuide) return null;

  return (
    <>
      <Button onClick={() => toggleSizeGuide(true)} text="Size Guide" variant="normal-sm" />
      <SidePanel title="Size Guide" show={showSizeGuide} onClose={() => toggleSizeGuide(false)}>
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
