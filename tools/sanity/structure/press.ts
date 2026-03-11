import { StructureBuilder } from 'sanity/structure';
import { TbFileText } from 'react-icons/tb';

const PressMenuItem = (S: StructureBuilder) =>
  S.listItem()
    .title('Press')
    .icon(TbFileText)
    .child(() =>
      S.list()
        .title('Press')
        .items([
          // All Press Pages
          S.listItem()
            .title('All Press')
            .icon(TbFileText)
            .child(() =>
              S.documentTypeList('press')
                .title('All Press Pages')
                .menuItems(S.documentTypeList('press').getMenuItems())
            ),
          S.divider()
        ])
    );

export default PressMenuItem;
