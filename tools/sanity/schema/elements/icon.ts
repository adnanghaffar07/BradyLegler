import * as icons from '../../../../assets/icons';
import { toTitleCase } from '../../../helpers/string';

const options = Object.keys(icons).map(key => ({
  title: toTitleCase(key),
  value: key
}));

const icon = {
  name: 'icon',
  title: 'Icon',
  type: 'string',
  options: {
    list: options,
    layout: 'dropdown'
  }
};

export default icon;
