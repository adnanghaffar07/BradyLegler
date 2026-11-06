import type { Metadata } from 'next';
import CustomizeTemplate from '@/templates/CustomizeTemplate';

export const metadata: Metadata = {
  title: 'Customize | Brady Legler',
  description: 'Brady Legler pieces you can customize: choose the metal and the stones or enamel.'
};

const CustomizePage = () => <CustomizeTemplate />;

export default CustomizePage;
