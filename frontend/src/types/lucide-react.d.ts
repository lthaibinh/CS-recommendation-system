declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  
  export const Search: ComponentType<LucideProps>;
  export const Cloud: ComponentType<LucideProps>;
  export const Menu: ComponentType<LucideProps>;
  export const ShoppingBag: ComponentType<LucideProps>;
  export const User: ComponentType<LucideProps>;
  export const Printer: ComponentType<LucideProps>;
  export const CreditCard: ComponentType<LucideProps>;
  export const Plus: ComponentType<LucideProps>;
  export const Edit3: ComponentType<LucideProps>;
  export const Trash2: ComponentType<LucideProps>;
  export const ChevronDown: ComponentType<LucideProps>;
  export const Table: ComponentType<LucideProps>;
  export const Clock: ComponentType<LucideProps>;
  export const CheckCircle: ComponentType<LucideProps>;
  export const AlertCircle: ComponentType<LucideProps>;
  export const ChevronLeft: ComponentType<LucideProps>;
  export const ChevronRight: ComponentType<LucideProps>;
  export const Star: ComponentType<LucideProps>;
  export const ShoppingCart: ComponentType<LucideProps>;
  export const TrendingUp: ComponentType<LucideProps>;
}
