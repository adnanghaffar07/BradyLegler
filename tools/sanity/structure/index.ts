import { StructureResolver } from 'sanity/structure';
import PageMenuItem from './pages';
import ArtworkMenuItem from './artwork';
import PressMenuItem from './press';
import GlobalMenuItem from './global';
import SettingsMenuItem from './settings';
import RoutesMenuItem from './routes';
import ProductsMenuItem from './products';
import CollectionsMenuItem from './collections';

const structure: StructureResolver = S =>
  S.list()
    .title('Content')
    .items([
      PageMenuItem(S),
      ArtworkMenuItem(S),
      PressMenuItem(S),
      S.divider(),
      ProductsMenuItem(S),
      CollectionsMenuItem(S),
      S.divider(),
      GlobalMenuItem(S)

      // Hide routes and settings for simplicity
      // S.divider(),
      // SettingsMenuItem(S),
      // ...RoutesMenuItem(S)
    ]);

export default structure;
