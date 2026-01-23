import { defineType } from 'sanity';
import { ILinkElement } from '../elements/link';

interface IHeaderObject {
  navItems: {
    title: string;
    link: ILinkElement;
    dropdown: boolean;
    side: string;
    navSublinks: {
      title: string;
      link: ILinkElement;
      navSublinks?: {
        // Add this for nested submenus
        title: string;
        link: ILinkElement;
      }[];
    }[];
  }[];
}

const navSublink = defineType({
  name: 'navSublink',
  title: 'Nav Sub Link',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Name',
      type: 'string'
    },
    {
      name: 'link',
      title: 'Link',
      type: 'linkElement',
      hidden: ({ parent }) => !!parent.navSublinks?.length // hide link if submenu exists
    },
    {
      name: 'requiresPasscode',
      title: 'Requires Passcode',
      type: 'boolean',
      description: 'Enable this to require a passcode to access this menu item',
      initialValue: false
    },
    {
      name: 'passcode',
      title: 'Passcode',
      type: 'string',
      description: 'Set a passcode to protect this menu item (e.g., for VIP access)',
      hidden: ({ parent }) => !parent.requiresPasscode,
      validation: Rule =>
        Rule.custom((passcode, context) => {
          const parent = context.parent as any;
          if (parent?.requiresPasscode && !passcode) {
            return 'Passcode is required when passcode protection is enabled';
          }
          return true;
        })
    },
    {
      name: 'image',
      title: 'Image (Optional)',
      type: 'image',
      options: { hotspot: true },
      description: 'Add an image to show alongside this submenu. Only one image per submenu.'
    },
    {
      name: 'navSublinks',
      title: 'Nested Sub Links',
      type: 'array',
      of: [{ type: 'navSublink' }],
      description: 'Add further nested submenus if needed'
    }
  ],
  preview: {
    select: {
      title: 'title',
      hasSubmenus: 'navSublinks',
      image: 'image'
    },
    prepare: ({ title, hasSubmenus, image }) => ({
      title: title || 'Dropdown Link',
      subtitle: hasSubmenus?.length ? `Has ${hasSubmenus.length} nested items` : image ? 'Has image' : 'Simple link'
    })
  }
});

// The rest of your schema remains the same...
const navLink = defineType({
  name: 'navLink',
  title: 'Nav Link',
  type: 'object',
  fields: [
    {
      title: 'Title',
      name: 'title',
      type: 'string'
    },
    {
      title: 'Link',
      name: 'link',
      type: 'linkElement'
    },
    {
      name: 'side',
      title: 'Desktop Position',
      type: 'string',
      options: {
        list: [
          { value: 'left', title: 'Left Side' },
          { value: 'right', title: 'Right Side' }
        ],
        layout: 'radio',
        direction: 'horizontal',
        initialValue: 'left'
      }
    },
    {
      title: 'Dropdown',
      description:
        'Choose whether to include a dropdown menu of sublinks. If this is on, we remove the link from the nav item itself.',
      name: 'dropdown',
      type: 'boolean'
    },
    {
      title: 'Nav Sublinks',
      name: 'navSublinks',
      type: 'array',
      of: [{ type: 'navSublink' }],
      hidden: ({ parent }) => !parent.dropdown,
      validation: Rule =>
        Rule.custom((self, { parent }) => {
          if (parent.dropdown && !self) {
            return 'Please add dropdown links.';
          }
          if (!parent.dropdown && !!self) {
            return 'Please remove dropdown links or switch navigation link to dropdown.';
          }
          return true;
        })
    }
  ],
  preview: {
    select: {
      title: 'title',
      dropdown: 'dropdown'
    },
    prepare: ({ title, dropdown }) => ({
      title: title || 'Nav Link',
      subtitle: dropdown ? 'Has dropdown' : 'Simple link'
    })
  }
});

const header = defineType({
  name: 'header',
  title: 'Header',
  type: 'object',
  fields: [
    {
      name: 'navItems',
      title: 'Nav Items',
      type: 'array',
      of: [{ type: 'navLink' }]
    }
  ],
  preview: {
    prepare() {
      return {
        title: `Header`
      };
    }
  }
});

export { header, navLink, navSublink };
export type { IHeaderObject };
