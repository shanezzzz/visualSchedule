export type NavItem = {
  label: string;
  href: string;
};

export const dashboardNavItems: NavItem[] = [
  { label: "Schedule Management", href: "/schedule" },
  { label: "Staff Settings", href: "/staff" },
  { label: "Reports", href: "/reports" },
  { label: "Profile", href: "/profile" },
];
