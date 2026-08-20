export type NavigationItem = {
  label: string;
  href: string;
  permission: string | null;
};

export const navigation: NavigationItem[] = [{ label: "Home", href: "/", permission: null }];
