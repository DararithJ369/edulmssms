"use client";

import Sidebar, { type SidebarProps } from "@/components/sidebar/Sidebar";

type MenuProps = SidebarProps;

const Menu = ({ role }: MenuProps) => <Sidebar role={role} />;

export default Menu;
