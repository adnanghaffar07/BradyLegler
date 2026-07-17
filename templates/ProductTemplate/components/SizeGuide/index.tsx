import React, { useState } from 'react';
import SidePanel, { SIDE_PANEL_Z_INDEX } from '@/components/SidePanel';
import Button from '@/components/Button';
import Text from '@/components/Text';
import classNames from '@/tools/helpers/classNames';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import { getFilteredSizeGuideTables } from './utils';
import styles from './styles.module.scss';

type SizeGuideTab = 'findYourSize' | 'howToMeasure';

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
  const [activeTab, setActiveTab] = useState<SizeGuideTab>('findYourSize');
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
        renderTitle={() => (
          <div className={styles.tabs}>
            <button
              type="button"
              className={classNames(styles.tab, { [styles.tabActive]: activeTab === 'findYourSize' })}
              onClick={() => setActiveTab('findYourSize')}
            >
              <Text text="Find Your Size" size="b2" color={activeTab === 'findYourSize' ? 'brand-black' : 'brand-black-40'} />
            </button>
            <button
              type="button"
              className={classNames(styles.tab, { [styles.tabActive]: activeTab === 'howToMeasure' })}
              onClick={() => setActiveTab('howToMeasure')}
            >
              <Text text="How to Measure" size="b2" color={activeTab === 'howToMeasure' ? 'brand-black' : 'brand-black-40'} />
            </button>
          </div>
        )}
        show={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        zIndex={SIDE_PANEL_Z_INDEX.elevated}
      >
        <SidePanel.Body>
          {activeTab === 'findYourSize' ? (
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
          ) : (
            <div className={styles.container}>
              <div>
                <Text as="h3" text="Using String or Paper" size="b3" spacing="md" />
                <Text as="ol">
                  <Text
                    as="li"
                    size="b2"
                    spacing="md"
                    text="You'll need a tape measure, a length of string, or a thin strip of paper."
                  />
                  <Text
                    as="li"
                    size="b2"
                    spacing="md"
                    text="Wrap it snugly around the base of the finger you plan to wear the ring on. If it's for a stack, measure where the ring will actually sit, then mark where the ends meet."
                  />
                  <Text
                    as="li"
                    size="b2"
                    spacing="md"
                    text="Lay it flat and measure the length up to your mark with a ruler. Compare that number to the chart above to find your closest Brady Legler size."
                  />
                </Text>
              </div>
              <div>
                <Text as="h3" text="Using a Ring You Already Own" size="b3" spacing="md" />
                <Text as="ol">
                  <Text as="li" size="b2" spacing="md" text="Pick a ring that already fits the intended finger well." />
                  <Text
                    as="li"
                    size="b2"
                    spacing="md"
                    text="Measure across the inside of the band to find its interior diameter in millimeters."
                  />
                  <Text
                    as="li"
                    size="b2"
                    spacing="md"
                    text="Match that measurement to the chart above to find your nearest size in mm."
                  />
                </Text>
              </div>
            </div>
          )}
        </SidePanel.Body>
      </SidePanel>
    </>
  );
};

export default SizeGuide;
